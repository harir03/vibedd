package com.tatva.audit.service;

import com.tatva.audit.dto.AuditLogRequest;
import com.tatva.audit.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for the immutable audit trail.
 * Supports creation and paginated querying of audit log entries.
 */
public interface AuditService {

    /**
     * Create a new append-only audit log entry.
     */
    AuditLogResponse createAuditLog(AuditLogRequest request);

    /**
     * Query audit logs with optional action and resourceType filters.
     */
    Page<AuditLogResponse> getAuditLogs(String action, String resourceType, Pageable pageable);

    /**
     * Get a single audit log entry by ID.
     */
    AuditLogResponse getAuditLogById(Long id);

    /**
     * Get all audit log entries for a specific entity (by resource ID).
     */
    Page<AuditLogResponse> getAuditLogsByEntityId(String entityId, Pageable pageable);

    /**
     * Get all audit log entries created by a specific user.
     */
    Page<AuditLogResponse> getAuditLogsByUserId(UUID userId, Pageable pageable);
}
