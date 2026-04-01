package com.tatva.audit.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.audit.dto.AuditLogRequest;
import com.tatva.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Kafka consumer for the {@code analytics.events} topic.
 * Converts incoming JSON events into audit log entries.
 * <p>
 * On failure, logs the error but does NOT rethrow — preventing infinite retry loops.
 * In production, failed messages should be forwarded to the DLQ ({@code analytics.events.dlq}).
 * </p>
 */
@Component
public class AuditEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditEventConsumer.class);
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public AuditEventConsumer(AuditService auditService, ObjectMapper objectMapper) {
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "analytics.events", groupId = "tatva-audit-cg")
    public void consumeAuditEvent(String message) {
        try {
            log.debug("Received audit event from Kafka: {}", message);
            JsonNode node = objectMapper.readTree(message);

            AuditLogRequest request = new AuditLogRequest(
                    parseUuid(node, "userId"),
                    getTextOrDefault(node, "action", "UNKNOWN"),
                    getTextOrDefault(node, "resourceType", "UNKNOWN"),
                    getText(node, "resourceId"),
                    getJsonString(node, "oldValue"),
                    getJsonString(node, "newValue"),
                    getText(node, "ipAddress"),
                    getText(node, "userAgent"),
                    parseUuid(node, "sessionId"),
                    getText(node, "justification"),
                    getJsonString(node, "details")
            );

            auditService.createAuditLog(request);
            log.info("Kafka audit event processed: action={}, resourceType={}",
                    request.action(), request.resourceType());
        } catch (Exception e) {
            // Log but don't rethrow — prevents infinite retry. DLQ handling in production.
            log.error("Failed to process Kafka audit event: {}", message, e);
        }
    }

    private UUID parseUuid(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            try {
                return UUID.fromString(node.get(field).asText());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID for field '{}': {}", field, node.get(field).asText());
            }
        }
        return null;
    }

    private String getText(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : null;
    }

    private String getTextOrDefault(JsonNode node, String field, String defaultValue) {
        String value = getText(node, field);
        return value != null ? value : defaultValue;
    }

    private String getJsonString(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            JsonNode child = node.get(field);
            return child.isObject() || child.isArray() ? child.toString() : child.asText();
        }
        return null;
    }
}
