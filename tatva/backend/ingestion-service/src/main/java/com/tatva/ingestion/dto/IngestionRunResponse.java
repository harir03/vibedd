package com.tatva.ingestion.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for an ingestion run.
 */
public record IngestionRunResponse(
        UUID id,
        UUID sourceId,
        String sourceName,
        Instant startedAt,
        Instant completedAt,
        String status,
        int documentsFetched,
        int entitiesExtracted,
        int relationsExtracted,
        String errors
) {}
