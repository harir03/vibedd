package com.tatva.audit.controller;

import com.tatva.audit.dto.AuditLogRequest;
import com.tatva.audit.dto.AuditLogResponse;
import com.tatva.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * REST controller for the immutable audit trail.
 * <p>
 * Provides endpoints to create audit entries and query audit history
 * with pagination and filtering. DELETE operations require justification.
 * </p>
 */
@RestController
@RequestMapping("/audit")
@Tag(name = "Audit", description = "Immutable audit trail — append-only logging and compliance")
public class AuditController {

    private static final Logger log = LoggerFactory.getLogger(AuditController.class);
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping("/log")
    @Operation(summary = "Record an audit event", description = "Creates an append-only audit log entry. DELETE actions require justification.")
    public ResponseEntity<AuditLogResponse> createAuditLog(@Valid @RequestBody AuditLogRequest request) {
        // Enforce justification for DELETE operations (government compliance)
        if ("DELETE".equalsIgnoreCase(request.action())
                && (request.justification() == null || request.justification().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Justification is required for DELETE operations");
        }

        log.info("Creating audit log: action={}, resourceType={}, resourceId={}",
                request.action(), request.resourceType(), request.resourceId());
        AuditLogResponse response = auditService.createAuditLog(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/logs")
    @Operation(summary = "Query audit history", description = "Returns paginated, filterable audit log entries sorted by timestamp DESC.")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditLogs(action, resourceType, pageable));
    }

    @GetMapping("/logs/{id}")
    @Operation(summary = "Get single audit entry", description = "Returns a single audit log entry by ID.")
    public ResponseEntity<AuditLogResponse> getAuditLogById(@PathVariable Long id) {
        AuditLogResponse response = auditService.getAuditLogById(id);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/entity/{entityId}")
    @Operation(summary = "Audit history for entity", description = "Returns all audit entries for a specific entity (resource ID).")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogsByEntityId(
            @PathVariable String entityId,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditLogsByEntityId(entityId, pageable));
    }

    @GetMapping("/logs/user/{userId}")
    @Operation(summary = "Audit history for user", description = "Returns all audit entries created by a specific user.")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogsByUserId(
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditLogsByUserId(userId, pageable));
    }
}
