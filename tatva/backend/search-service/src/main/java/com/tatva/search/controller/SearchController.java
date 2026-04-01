package com.tatva.search.controller;

import com.tatva.search.dto.SearchResponse;
import com.tatva.search.service.IndexingService;
import com.tatva.search.service.SearchService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for search operations.
 * Provides full-text search, autocomplete, vector similarity, and document search.
 */
@RestController
@RequestMapping("/search")
@Validated
public class SearchController {

    private final SearchService searchService;
    private final IndexingService indexingService;

    public SearchController(SearchService searchService, IndexingService indexingService) {
        this.searchService = searchService;
        this.indexingService = indexingService;
    }

    // ── Full-Text Entity Search ───────────────────────────────────────

    /**
     * GET /search/entities?q=India&domain=Geopolitics&type=PERSON&page=0&size=20
     * Full-text search across all entity indices with synonym + fuzzy support.
     */
    @GetMapping("/entities")
    public ResponseEntity<SearchResponse> searchEntities(
            @RequestParam("q") @NotBlank @Size(max = 500) String query,
            @RequestParam(value = "domain", required = false) String domain,
            @RequestParam(value = "type", required = false) String type,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearanceLevel,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) @Max(100) int size) {

        SearchResponse response = searchService.searchEntities(
                query, domain, type, clearanceLevel, page, size);
        return ResponseEntity.ok(response);
    }

    // ── Autocomplete ──────────────────────────────────────────────────

    /**
     * GET /search/autocomplete?q=Ind&limit=10
     * Prefix-based autocomplete using edge n-gram analyzer.
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<List<Map<String, Object>>> autocomplete(
            @RequestParam("q") @NotBlank @Size(max = 200) String prefix,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearanceLevel,
            @RequestParam(value = "limit", defaultValue = "10") @Min(1) @Max(50) int limit) {

        List<Map<String, Object>> suggestions = searchService.autocomplete(
                prefix, clearanceLevel, limit);
        return ResponseEntity.ok(suggestions);
    }

    // ── Vector Similarity (kNN) ───────────────────────────────────────

    /**
     * GET /search/similar/{id}?topK=10
     * Vector similarity search using entity embeddings.
     */
    @GetMapping("/similar/{id}")
    public ResponseEntity<SearchResponse> findSimilar(
            @PathVariable("id") @NotBlank String id,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearanceLevel,
            @RequestParam(value = "topK", defaultValue = "10") @Min(1) @Max(100) int topK) {

        SearchResponse response = searchService.findSimilar(id, clearanceLevel, topK);
        return ResponseEntity.ok(response);
    }

    // ── Re-Indexing Trigger ───────────────────────────────────────────

    /**
     * POST /search/index
     * Trigger a re-indexing of entities from Neo4j into Elasticsearch.
     */
    @PostMapping("/index")
    public ResponseEntity<Map<String, Object>> triggerReindex() {
        Map<String, Object> result = indexingService.triggerReindex();
        return ResponseEntity.ok(result);
    }

    // ── Document Search ───────────────────────────────────────────────

    /**
     * GET /search/documents?q=defense+deal&domain=Defense&page=0&size=20
     * Full-text search across the documents index.
     */
    @GetMapping("/documents")
    public ResponseEntity<SearchResponse> searchDocuments(
            @RequestParam("q") @NotBlank @Size(max = 500) String query,
            @RequestParam(value = "domain", required = false) String domain,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearanceLevel,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) @Max(100) int size) {

        SearchResponse response = searchService.searchDocuments(
                query, domain, clearanceLevel, page, size);
        return ResponseEntity.ok(response);
    }
}
