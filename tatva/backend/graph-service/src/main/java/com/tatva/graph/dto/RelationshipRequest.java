package com.tatva.graph.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

/**
 * Request DTO for creating a typed relationship between two entities.
 * All temporal and metadata properties are stored as relationship properties.
 */
public record RelationshipRequest(
        @NotBlank(message = "Source entity ID is required")
        String sourceId,

        @NotBlank(message = "Target entity ID is required")
        String targetId,

        @NotBlank(message = "Relationship type is required")
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
