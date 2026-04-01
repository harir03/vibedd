package com.tatva.audit.service.impl;

import com.tatva.audit.dto.AuditLogRequest;
import com.tatva.audit.dto.AuditLogResponse;
import com.tatva.audit.model.AuditLog;
import com.tatva.audit.repository.AuditLogRepository;
import com.tatva.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Implementation of the audit trail service.
 * All reads are read-only transactions; writes are full transactions.
 */
@Service
@Transactional(readOnly = true)
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);
    private final AuditLogRepository repository;

    public AuditServiceImpl(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public AuditLogResponse createAuditLog(AuditLogRequest request) {
        AuditLog entity = new AuditLog();
        entity.setTimestamp(Instant.now());
        entity.setUserId(request.userId());
        entity.setAction(request.action());
        entity.setResourceType(request.resourceType());
        entity.setResourceId(request.resourceId());
        entity.setOldValue(request.oldValue());
        entity.setNewValue(request.newValue());
        entity.setIpAddress(request.ipAddress());
        entity.setUserAgent(request.userAgent());
        entity.setSessionId(request.sessionId());
        entity.setJustification(request.justification());
        entity.setDetails(request.details());

        AuditLog saved = repository.save(entity);
        log.info("Audit log created: id={}, action={}, resourceType={}, resourceId={}",
                saved.getId(), saved.getAction(), saved.getResourceType(), saved.getResourceId());
        return toResponse(saved);
    }

    @Override
    public Page<AuditLogResponse> getAuditLogs(String action, String resourceType, Pageable pageable) {
        if (action != null && resourceType != null) {
            return repository.findByActionAndResourceType(action, resourceType, pageable)
                    .map(this::toResponse);
        } else if (action != null) {
            return repository.findByAction(action, pageable)
                    .map(this::toResponse);
        } else if (resourceType != null) {
            return repository.findByResourceType(resourceType, pageable)
                    .map(this::toResponse);
        }
        return repository.findAll(pageable).map(this::toResponse);
    }

    @Override
    public AuditLogResponse getAuditLogById(Long id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    public Page<AuditLogResponse> getAuditLogsByEntityId(String entityId, Pageable pageable) {
        return repository.findByResourceId(entityId, pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<AuditLogResponse> getAuditLogsByUserId(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog entity) {
        return new AuditLogResponse(
                entity.getId(),
                entity.getTimestamp(),
                entity.getUserId(),
                entity.getAction(),
                entity.getResourceType(),
                entity.getResourceId(),
                entity.getOldValue(),
                entity.getNewValue(),
                entity.getIpAddress(),
                entity.getUserAgent(),
                entity.getSessionId(),
                entity.getJustification(),
                entity.getDetails()
        );
    }
}
