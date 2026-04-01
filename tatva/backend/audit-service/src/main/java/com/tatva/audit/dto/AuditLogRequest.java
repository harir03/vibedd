package com.tatva.audit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request DTO for creating an audit log entry.
 * <p>{@code action} and {@code resourceType} are mandatory.
 * {@code justification} is required when {@code action} is DELETE (enforced in controller).</p>
 */
public record AuditLogRequest(
        UUID userId,

        @NotBlank(message = "Action is required")
        @Size(max = 50, message = "Action must be at most 50 characters")
        String action,

        @NotBlank(message = "Resource type is required")
        @Size(max = 50, message = "Resource type must be at most 50 characters")
        String resourceType,

        @Size(max = 255, message = "Resource ID must be at most 255 characters")
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
