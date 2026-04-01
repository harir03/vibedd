package com.tatva.ingestion.controller;

import com.tatva.ingestion.dto.IngestionRunResponse;
import com.tatva.ingestion.dto.SourceRequest;
import com.tatva.ingestion.dto.SourceResponse;
import com.tatva.ingestion.service.IngestionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for data ingestion operations.
 */
@RestController
@RequestMapping("/ingest")
@Validated
public class IngestionController {

    private final IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    /**
     * POST /ingest/sources — Register a new RSS/API data source.
     */
    @PostMapping("/sources")
    public ResponseEntity<SourceResponse> createSource(@Valid @RequestBody SourceRequest request) {
        SourceResponse response = ingestionService.createSource(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /ingest/sources — List all registered data sources.
     */
    @GetMapping("/sources")
    public ResponseEntity<List<SourceResponse>> listSources() {
        return ResponseEntity.ok(ingestionService.listSources());
    }

    /**
     * POST /ingest/trigger?sourceId={id} — Trigger ingestion for a specific source.
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerIngestion(
            @RequestParam("sourceId") UUID sourceId) {
        Map<String, Object> result = ingestionService.triggerIngestion(sourceId);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /ingest/trigger-all — Trigger ingestion for all active sources.
     */
    @PostMapping("/trigger-all")
    public ResponseEntity<Map<String, Object>> triggerAll() {
        Map<String, Object> result = ingestionService.triggerAll();
        return ResponseEntity.ok(result);
    }

    /**
     * GET /ingest/runs?limit=20 — Get recent ingestion run history.
     */
    @GetMapping("/runs")
    public ResponseEntity<List<IngestionRunResponse>> getRecentRuns(
            @RequestParam(value = "limit", defaultValue = "20")
            @Min(1) @Max(100) int limit) {
        return ResponseEntity.ok(ingestionService.getRecentRuns(limit));
    }
}
