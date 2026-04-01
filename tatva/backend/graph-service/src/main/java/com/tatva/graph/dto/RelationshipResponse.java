package com.tatva.graph.dto;

import java.util.Map;

/**
 * Response DTO representing a relationship in the knowledge graph.
 */
public record RelationshipResponse(
        String sourceId,
        String targetId,
        String type,
        String validFrom,
        String validTo,
        Double strength,
        String description,
        String domain,
        Double credibilityScore,
        Map<String, Object> properties
) {
}
