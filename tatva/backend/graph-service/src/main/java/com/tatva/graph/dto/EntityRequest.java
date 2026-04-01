package com.tatva.graph.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for creating or updating a graph entity.
 * The {@code label} determines the Neo4j node label (Actor, Event, Location, etc.).
 */
public record EntityRequest(
        @NotBlank(message = "Label is required")
        String label,

        @NotBlank(message = "Canonical name is required")
        @Size(max = 500, message = "Canonical name must be at most 500 characters")
        String canonicalName,

        List<String> aliases,

        String description,

        @NotBlank(message = "Domain is required")
        String domain,

        String type,

        @DecimalMin(value = "0.0", message = "Credibility score must be >= 0.0")
        @DecimalMax(value = "1.0", message = "Credibility score must be <= 1.0")
        Double credibilityScore,

        @Min(value = 0, message = "Clearance level must be >= 0")
        @Max(value = 5, message = "Clearance level must be <= 5")
        Integer clearanceLevel,

        Map<String, Object> properties
) {
    public EntityRequest {
        if (credibilityScore == null) credibilityScore = 0.5;
        if (clearanceLevel == null) clearanceLevel = 0;
    }
}
