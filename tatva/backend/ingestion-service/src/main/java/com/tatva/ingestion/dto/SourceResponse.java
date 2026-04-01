package com.tatva.ingestion.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for an ingestion source.
 */
public record SourceResponse(
        UUID id,
        String name,
        String sourceType,
        String url,
        int reliabilityTier,
        String domain,
        String scheduleCron,
        Instant lastSuccessfulRun,
        boolean active
) {}
