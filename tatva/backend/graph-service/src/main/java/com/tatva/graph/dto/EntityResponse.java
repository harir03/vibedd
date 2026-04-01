package com.tatva.graph.dto;

import java.util.List;
import java.util.Map;

/**
 * Response DTO representing a graph entity from Neo4j.
 */
public record EntityResponse(
        String id,
        String label,
        String canonicalName,
        List<String> aliases,
        String description,
        String domain,
        String type,
        Double credibilityScore,
        Integer clearanceLevel,
        String createdAt,
        String updatedAt,
        Map<String, Object> properties
) {
}
