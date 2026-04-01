package com.tatva.alert.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.alert.service.AlertEvaluationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes alert trigger events from Kafka topic and evaluates them
 * against active rules via AlertEvaluationService.
 *
 * Expected message format (JSON):
 * {
 *   "alertType": "ENTITY_ALERT",
 *   "title": "New information about India",
 *   "description": "3 new articles mentioning India detected",
 *   "entityIds": "[\"entity-uuid-1\"]",
 *   "metadata": "{\"source\": \"ingestion-pipeline\"}"
 * }
 */
@Component
public class AlertTriggerConsumer {

    private static final Logger log = LoggerFactory.getLogger(AlertTriggerConsumer.class);

    private final AlertEvaluationService evaluationService;
    private final ObjectMapper objectMapper;

    public AlertTriggerConsumer(AlertEvaluationService evaluationService) {
        this.evaluationService = evaluationService;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "alert.triggers", groupId = "tatva-alert-cg")
    public void onAlertTrigger(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);

            String alertType = node.path("alertType").asText("ENTITY_ALERT");
            String title = node.path("title").asText("Untitled Alert");
            String description = node.path("description").asText(null);
            String entityIds = node.has("entityIds") ? node.get("entityIds").toString() : "[]";
            String metadata = node.has("metadata") ? node.get("metadata").toString() : "{}";

            evaluationService.evaluate(alertType, title, description, entityIds, metadata);

        } catch (Exception e) {
            log.error("Failed to process alert trigger message: {}", e.getMessage(), e);
            // In production, send to DLQ: alert.triggers.dlq
        }
    }
}
