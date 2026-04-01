package com.tatva.alert.service.impl;

import com.tatva.alert.model.AlertEvent;
import com.tatva.alert.repository.AlertEventRepository;
import com.tatva.alert.service.AlertEvaluationService;
import com.tatva.alert.websocket.AlertBroadcaster;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Evaluates incoming triggers, applies clustering, fires alerts,
 * and pushes real-time notifications via WebSocket.
 */
@Service
public class AlertEvaluationServiceImpl implements AlertEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(AlertEvaluationServiceImpl.class);

    /** Default clustering window: 30 minutes. Related alerts within this window are suppressed. */
    private static final int DEFAULT_CLUSTER_WINDOW_MINUTES = 30;

    private final AlertEventRepository eventRepository;
    private final AlertBroadcaster broadcaster;

    public AlertEvaluationServiceImpl(AlertEventRepository eventRepository,
                                      AlertBroadcaster broadcaster) {
        this.eventRepository = eventRepository;
        this.broadcaster = broadcaster;
    }

    @Override
    public AlertEvent evaluate(String alertType, String title, String description,
                               String entityIds, String metadata) {
        // Alert clustering: check if a similar alert was fired recently
        if (isDuplicate(alertType, entityIds, DEFAULT_CLUSTER_WINDOW_MINUTES)) {
            log.info("Alert suppressed (clustered): type={}, title={}", alertType, title);
            return null;
        }

        // Determine priority based on alert type
        String priority = determinePriority(alertType);

        // Create and persist the alert event
        AlertEvent event = new AlertEvent();
        event.setAlertType(alertType);
        event.setPriority(priority);
        event.setTitle(title);
        event.setDescription(description);
        event.setEntityIds(entityIds != null ? entityIds : "[]");
        event.setMetadata(metadata != null ? metadata : "{}");

        AlertEvent saved = eventRepository.save(event);
        log.info("Alert fired: id={}, type={}, priority={}, title={}", saved.getId(), alertType, priority, title);

        // Push via WebSocket
        broadcaster.broadcast(saved);

        return saved;
    }

    @Override
    public boolean isDuplicate(String alertType, String entityIds, int windowMinutes) {
        Instant since = Instant.now().minus(windowMinutes, ChronoUnit.MINUTES);
        List<AlertEvent> recent = eventRepository
                .findByAlertTypeAndFiredAtAfterOrderByFiredAtDesc(alertType, since);

        // Check if any recent alert has the same entity IDs (exact match for clustering)
        for (AlertEvent existing : recent) {
            if (normalizeJson(existing.getEntityIds()).equals(normalizeJson(entityIds))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Assigns priority based on alert type.
     * ANOMALY_ALERT and CONTRADICTION_ALERT are WARNING by default.
     * THRESHOLD_ALERT is CRITICAL.
     * Others default to INFO.
     */
    private String determinePriority(String alertType) {
        return switch (alertType) {
            case "ANOMALY_ALERT", "CONTRADICTION_ALERT" -> "WARNING";
            case "THRESHOLD_ALERT" -> "CRITICAL";
            case "TREND_ALERT" -> "INFO";
            case "ENTITY_ALERT", "RELATIONSHIP_ALERT" -> "INFO";
            default -> "INFO";
        };
    }

    /** Normalize JSON string for comparison (trim whitespace). */
    private String normalizeJson(String json) {
        if (json == null) return "[]";
        return json.trim();
    }
}
