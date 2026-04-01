package com.tatva.search.service.impl;

import com.tatva.search.dto.SearchResponse;
import com.tatva.search.service.SearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch.core.SearchRequest;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Elasticsearch search operations implementation.
 * Uses the Elasticsearch Java Client (co.elastic.clients) for query building.
 * All user inputs go through QueryBuilders — never raw JSON concatenation.
 */
@Service
public class SearchServiceImpl implements SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchServiceImpl.class);

    private static final String INDEX_ACTORS = "tatva-actors";
    private static final String INDEX_EVENTS = "tatva-events";
    private static final String INDEX_LOCATIONS = "tatva-locations";
    private static final String INDEX_DOCUMENTS = "tatva-documents";

    private static final List<String> ENTITY_INDICES =
            List.of(INDEX_ACTORS, INDEX_EVENTS, INDEX_LOCATIONS);

    private final ElasticsearchClient esClient;

    public SearchServiceImpl(ElasticsearchClient esClient) {
        this.esClient = esClient;
    }

    // ── Full-Text Entity Search ───────────────────────────────────────

    @Override
    public SearchResponse searchEntities(String query, String domain, String type,
                                         int clearanceLevel, int page, int size) {
        long start = System.currentTimeMillis();

        try {
            var boolQuery = buildEntityBoolQuery(query, domain, type, clearanceLevel);

            var request = SearchRequest.of(s -> s
                    .index(ENTITY_INDICES)
                    .query(q -> q.bool(boolQuery))
                    .from(page * size)
                    .size(size)
                    .highlight(h -> h
                            .fields("canonicalName", f -> f.preTags("<em>").postTags("</em>"))
                            .fields("description", f -> f.preTags("<em>").postTags("</em>"))
                            .fields("aliases", f -> f.preTags("<em>").postTags("</em>"))
                    )
            );

            var response = esClient.search(request, Map.class);
            long tookMs = System.currentTimeMillis() - start;

            return toSearchResponse(query, response, page, size, tookMs);

        } catch (IOException e) {
            log.error("Elasticsearch search failed for query '{}': {}", query, e.getMessage(), e);
            throw new RuntimeException("Search operation failed", e);
        }
    }

    // ── Autocomplete ──────────────────────────────────────────────────

    @Override
    public List<Map<String, Object>> autocomplete(String prefix, int clearanceLevel, int limit) {
        try {
            var request = SearchRequest.of(s -> s
                    .index(ENTITY_INDICES)
                    .query(q -> q.bool(b -> b
                            .must(m -> m.match(mt -> mt
                                    .field("canonicalName.autocomplete")
                                    .query(prefix)
                            ))
                            .filter(f -> f.range(r -> r
                                    .number(n -> n.field("clearanceLevel").lte((double) clearanceLevel))
                            ))
                    ))
                    .size(limit > 0 ? limit : 10)
                    .source(src -> src
                            .filter(fl -> fl
                                    .includes("id", "canonicalName", "type", "domain", "credibilityScore")
                            )
                    )
            );

            var response = esClient.search(request, Map.class);

            return response.hits().hits().stream()
                    .map(hit -> {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> source = (Map<String, Object>) hit.source();
                        if (source == null) source = Map.of();
                        Map<String, Object> result = new LinkedHashMap<>(source);
                        result.put("_score", hit.score());
                        return result;
                    })
                    .collect(Collectors.toList());

        } catch (IOException e) {
            log.error("Autocomplete failed for prefix '{}': {}", prefix, e.getMessage(), e);
            throw new RuntimeException("Autocomplete operation failed", e);
        }
    }

    // ── Vector Similarity (kNN) ───────────────────────────────────────

    @Override
    public SearchResponse findSimilar(String entityId, int clearanceLevel, int topK) {
        long start = System.currentTimeMillis();

        try {
            // Step 1: Fetch the source entity's embedding vector
            float[] embedding = fetchEmbedding(entityId);
            if (embedding == null) {
                return new SearchResponse(entityId, 0, 0, topK, 0, List.of());
            }

            // Step 2: kNN search using the embedding
            List<Float> embeddingList = new ArrayList<>();
            for (float v : embedding) {
                embeddingList.add(v);
            }

            var request = SearchRequest.of(s -> s
                    .index(ENTITY_INDICES)
                    .knn(k -> k
                            .field("embedding")
                            .queryVector(embeddingList)
                            .k(topK)
                            .numCandidates(topK * 5)
                    )
                    .query(q -> q.bool(b -> b
                            .filter(f -> f.range(r -> r
                                    .number(n -> n.field("clearanceLevel").lte((double) clearanceLevel))
                            ))
                            .mustNot(mn -> mn.term(t -> t
                                    .field("id")
                                    .value(entityId)
                            ))
                    ))
                    .size(topK)
            );

            var response = esClient.search(request, Map.class);
            long tookMs = System.currentTimeMillis() - start;

            return toSearchResponse(entityId, response, 0, topK, tookMs);

        } catch (IOException e) {
            log.error("Similar search failed for entity '{}': {}", entityId, e.getMessage(), e);
            throw new RuntimeException("Similar search operation failed", e);
        }
    }

    // ── Document Search ───────────────────────────────────────────────

    @Override
    public SearchResponse searchDocuments(String query, String domain,
                                          int clearanceLevel, int page, int size) {
        long start = System.currentTimeMillis();

        try {
            var boolBuilder = new BoolQuery.Builder();

            boolBuilder.must(m -> m.multiMatch(mm -> mm
                    .query(query)
                    .fields("title^3", "content", "summary^2", "sourceName")
                    .fuzziness("AUTO")
            ));

            boolBuilder.filter(f -> f.range(r -> r
                    .number(n -> n.field("clearanceLevel").lte((double) clearanceLevel))
            ));

            if (domain != null && !domain.isBlank()) {
                boolBuilder.filter(f -> f.term(t -> t
                        .field("domain")
                        .value(domain)
                ));
            }

            var boolQuery = boolBuilder.build();

            var request = SearchRequest.of(s -> s
                    .index(INDEX_DOCUMENTS)
                    .query(q -> q.bool(boolQuery))
                    .from(page * size)
                    .size(size)
                    .highlight(h -> h
                            .fields("title", f -> f.preTags("<em>").postTags("</em>"))
                            .fields("content", f -> f
                                    .preTags("<em>").postTags("</em>")
                                    .fragmentSize(200).numberOfFragments(3)
                            )
                    )
            );

            var response = esClient.search(request, Map.class);
            long tookMs = System.currentTimeMillis() - start;

            return toSearchResponse(query, response, page, size, tookMs);

        } catch (IOException e) {
            log.error("Document search failed for query '{}': {}", query, e.getMessage(), e);
            throw new RuntimeException("Document search operation failed", e);
        }
    }

    // ── Private Helpers ───────────────────────────────────────────────

    private BoolQuery buildEntityBoolQuery(String query, String domain, String type,
                                            int clearanceLevel) {
        var builder = new BoolQuery.Builder();

        // Multi-match across entity text fields with boosting
        builder.must(m -> m.multiMatch(mm -> mm
                .query(query)
                .fields("canonicalName^5", "aliases^3", "description", "type^2")
                .fuzziness("AUTO")
        ));

        // Clearance level filter — only return data at or below user's level
        builder.filter(f -> f.range(r -> r
                .number(n -> n.field("clearanceLevel").lte((double) clearanceLevel))
        ));

        // Optional domain filter
        if (domain != null && !domain.isBlank()) {
            builder.filter(f -> f.term(t -> t
                    .field("domain")
                    .value(domain)
            ));
        }

        // Optional entity type filter
        if (type != null && !type.isBlank()) {
            builder.filter(f -> f.term(t -> t
                    .field("type")
                    .value(type)
            ));
        }

        return builder.build();
    }

    @SuppressWarnings("unchecked")
    private float[] fetchEmbedding(String entityId) throws IOException {
        // Search across entity indices for the document with this ID
        var request = SearchRequest.of(s -> s
                .index(ENTITY_INDICES)
                .query(q -> q.term(t -> t
                        .field("id")
                        .value(entityId)
                ))
                .size(1)
                .source(src -> src
                        .filter(fl -> fl.includes("embedding"))
                )
        );

        var response = esClient.search(request, Map.class);
        if (response.hits().hits().isEmpty()) {
            log.warn("Entity '{}' not found in Elasticsearch", entityId);
            return null;
        }

        Map<String, Object> source = (Map<String, Object>) response.hits().hits().get(0).source();
        if (source == null || !source.containsKey("embedding")) {
            log.warn("Entity '{}' has no embedding vector", entityId);
            return null;
        }

        List<Number> embList = (List<Number>) source.get("embedding");
        float[] embedding = new float[embList.size()];
        for (int i = 0; i < embList.size(); i++) {
            embedding[i] = embList.get(i).floatValue();
        }
        return embedding;
    }

    @SuppressWarnings("unchecked")
    private SearchResponse toSearchResponse(String query,
                                            co.elastic.clients.elasticsearch.core.SearchResponse<Map> esResponse,
                                            int page, int size, long tookMs) {
        long totalHits = esResponse.hits().total() != null
                ? esResponse.hits().total().value() : 0;

        List<SearchResponse.SearchHit> hits = esResponse.hits().hits().stream()
                .map(hit -> {
                    Map<String, Object> source = (Map<String, Object>) hit.source();
                    if (source == null) source = Map.of();

                    Map<String, List<String>> highlights = new LinkedHashMap<>();
                    if (hit.highlight() != null) {
                        hit.highlight().forEach(highlights::put);
                    }

                    return new SearchResponse.SearchHit(
                            hit.id(),
                            hit.index(),
                            hit.score() != null ? hit.score() : 0.0,
                            source,
                            highlights
                    );
                })
                .collect(Collectors.toList());

        return new SearchResponse(query, totalHits, page, size, tookMs, hits);
    }
}
