package com.tatva.audit.repository;

import com.tatva.audit.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA repository for the append-only {@code audit_log} table.
 * Supports paginated, filterable queries for audit trail inspection.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByAction(String action, Pageable pageable);

    Page<AuditLog> findByResourceType(String resourceType, Pageable pageable);

    Page<AuditLog> findByActionAndResourceType(String action, String resourceType, Pageable pageable);

    Page<AuditLog> findByResourceId(String resourceId, Pageable pageable);

    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);
}
