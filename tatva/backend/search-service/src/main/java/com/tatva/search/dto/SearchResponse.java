package com.tatva.search.dto;

import java.util.List;
import java.util.Map;

/**
 * Response DTO wrapping search results.
 */
public record SearchResponse(
        String query,
        long totalHits,
        int page,
        int size,
        long tookMs,
        List<SearchHit> hits
) {
    /**
     * A single search result hit.
     */
    public record SearchHit(
            String id,
            String index,
            double score,
            Map<String, Object> source,
            Map<String, List<String>> highlights
    ) {}
}
