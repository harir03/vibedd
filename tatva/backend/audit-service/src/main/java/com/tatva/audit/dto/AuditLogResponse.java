package com.tatva.audit.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for audit log entries.
 * Maps all columns from the {@code audit_log} table.
 */
public record AuditLogResponse(
        Long id,
        Instant timestamp,
        UUID userId,
        String action,
        String resourceType,
        String resourceId,
        String oldValue,
        String newValue,
        String ipAddress,
        String userAgent,
        UUID sessionId,
        String justification,
        String details
) {
}
