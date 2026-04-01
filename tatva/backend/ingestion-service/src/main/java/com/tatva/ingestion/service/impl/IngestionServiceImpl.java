package com.tatva.ingestion.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.ingestion.dto.IngestionRunResponse;
import com.tatva.ingestion.dto.SourceRequest;
import com.tatva.ingestion.dto.SourceResponse;
import com.tatva.ingestion.kafka.ArticleProducer;
import com.tatva.ingestion.model.IngestionRun;
import com.tatva.ingestion.model.IngestionSource;
import com.tatva.ingestion.repository.IngestionRunRepository;
import com.tatva.ingestion.repository.IngestionSourceRepository;
import com.tatva.ingestion.service.DeduplicationService;
import com.tatva.ingestion.service.IngestionService;
import com.tatva.ingestion.service.RssFeedConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

/**
 * Implementation of the ingestion service.
 * Orchestrates RSS fetching, deduplication, and Kafka publishing.
 */
@Service
public class IngestionServiceImpl implements IngestionService {

    private static final Logger log = LoggerFactory.getLogger(IngestionServiceImpl.class);

    private final IngestionSourceRepository sourceRepo;
    private final IngestionRunRepository runRepo;
    private final RssFeedConnector rssFeedConnector;
    private final DeduplicationService deduplicationService;
    private final ArticleProducer articleProducer;
    private final ObjectMapper objectMapper;

    public IngestionServiceImpl(IngestionSourceRepository sourceRepo,
                                IngestionRunRepository runRepo,
                                RssFeedConnector rssFeedConnector,
                                DeduplicationService deduplicationService,
                                ArticleProducer articleProducer,
                                ObjectMapper objectMapper) {
        this.sourceRepo = sourceRepo;
        this.runRepo = runRepo;
        this.rssFeedConnector = rssFeedConnector;
        this.deduplicationService = deduplicationService;
        this.articleProducer = articleProducer;
        this.objectMapper = objectMapper;
    }

    // ── Source Management ─────────────────────────────────────────────

    @Override
    @Transactional
    public SourceResponse createSource(SourceRequest request) {
        IngestionSource source = new IngestionSource();
        source.setName(request.name());
        source.setSourceType(request.sourceType());
        source.setUrl(request.url());
        source.setReliabilityTier(request.reliabilityTier());
        source.setDomain(request.domain());
        source.setScheduleCron(request.scheduleCron());
        source.setActive(true);

        IngestionSource saved = sourceRepo.save(source);
        log.info("Registered new source: {} ({})", saved.getName(), saved.getId());
        return toSourceResponse(saved);
    }

    @Override
    public List<SourceResponse> listSources() {
        return sourceRepo.findAll().stream()
                .map(this::toSourceResponse)
                .toList();
    }

    // ── Ingestion Triggers ────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> triggerIngestion(UUID sourceId) {
        IngestionSource source = sourceRepo.findById(sourceId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Source not found: " + sourceId));

        return executeIngestion(source);
    }

    @Override
    @Transactional
    public Map<String, Object> triggerAll() {
        List<IngestionSource> activeSources = sourceRepo.findByActiveTrue();
        List<Map<String, Object>> results = new ArrayList<>();

        for (IngestionSource source : activeSources) {
            try {
                results.add(executeIngestion(source));
            } catch (Exception e) {
                log.error("Failed to ingest source {}: {}", source.getName(), e.getMessage());
                results.add(Map.of(
                        "sourceId", source.getId().toString(),
                        "sourceName", source.getName(),
                        "status", "failed",
                        "error", e.getMessage()
                ));
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("triggeredAt", Instant.now().toString());
        summary.put("totalSources", activeSources.size());
        summary.put("results", results);
        return summary;
    }

    // ── Run History ───────────────────────────────────────────────────

    @Override
    public List<IngestionRunResponse> getRecentRuns(int limit) {
        return runRepo.findAllByOrderByStartedAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(this::toRunResponse)
                .toList();
    }

    // ── Private: Core Ingestion Logic ─────────────────────────────────

    private Map<String, Object> executeIngestion(IngestionSource source) {
        IngestionRun run = new IngestionRun();
        run.setSource(source);
        run.setStartedAt(Instant.now());
        run.setStatus("running");
        run = runRepo.save(run);

        int fetched = 0;
        int published = 0;
        int duplicates = 0;
        List<String> errors = new ArrayList<>();

        try {
            List<Map<String, String>> articles = rssFeedConnector.fetchFeed(source.getUrl());
            fetched = articles.size();

            for (Map<String, String> article : articles) {
                String title = article.getOrDefault("title", "");
                String description = article.getOrDefault("description", "");
                String link = article.getOrDefault("link", "");

                // SHA-256 deduplication
                if (deduplicationService.isDuplicate(title, description, link)) {
                    duplicates++;
                    continue;
                }

                // Build article payload for Kafka
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("title", title);
                payload.put("description", description);
                payload.put("link", link);
                payload.put("pubDate", article.getOrDefault("pubDate", ""));
                payload.put("feedUrl", source.getUrl());
                payload.put("sourceName", source.getName());
                payload.put("sourceTier", source.getReliabilityTier());
                payload.put("domain", source.getDomain());
                payload.put("ingestedAt", Instant.now().toString());

                String contentHash = deduplicationService.computeHash(title, description, link);
                payload.put("contentHash", contentHash);

                String json = objectMapper.writeValueAsString(payload);
                articleProducer.publish(contentHash, json);
                published++;
            }

            run.setStatus("success");
            run.setDocumentsFetched(fetched);
            run.setCompletedAt(Instant.now());

            // Update source last run timestamp
            source.setLastSuccessfulRun(Instant.now());
            sourceRepo.save(source);

        } catch (Exception e) {
            log.error("Ingestion error for source {}: {}", source.getName(), e.getMessage(), e);
            run.setStatus("failed");
            errors.add(e.getMessage());
            try {
                run.setErrors(objectMapper.writeValueAsString(errors));
            } catch (Exception ignored) {
                run.setErrors("[\"serialization error\"]");
            }
        }

        run.setCompletedAt(Instant.now());
        runRepo.save(run);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sourceId", source.getId().toString());
        result.put("sourceName", source.getName());
        result.put("runId", run.getId().toString());
        result.put("status", run.getStatus());
        result.put("fetched", fetched);
        result.put("published", published);
        result.put("duplicatesSkipped", duplicates);
        if (!errors.isEmpty()) {
            result.put("errors", errors);
        }
        return result;
    }

    // ── Mappers ───────────────────────────────────────────────────────

    private SourceResponse toSourceResponse(IngestionSource source) {
        return new SourceResponse(
                source.getId(),
                source.getName(),
                source.getSourceType(),
                source.getUrl(),
                source.getReliabilityTier(),
                source.getDomain(),
                source.getScheduleCron(),
                source.getLastSuccessfulRun(),
                source.isActive()
        );
    }

    private IngestionRunResponse toRunResponse(IngestionRun run) {
        return new IngestionRunResponse(
                run.getId(),
                run.getSource() != null ? run.getSource().getId() : null,
                run.getSource() != null ? run.getSource().getName() : null,
                run.getStartedAt(),
                run.getCompletedAt(),
                run.getStatus(),
                run.getDocumentsFetched(),
                run.getEntitiesExtracted(),
                run.getRelationsExtracted(),
                run.getErrors()
        );
    }
}
