package com.tatva.alert.service;

import com.tatva.alert.model.AlertEvent;

/**
 * Evaluates incoming events against active alert rules
 * and fires AlertEvents when conditions are met.
 * Implements alert clustering to prevent alert fatigue.
 */
public interface AlertEvaluationService {

    /**
     * Evaluates an incoming trigger event (from Kafka) against active rules.
     * Creates AlertEvent entries and notifies via WebSocket.
     */
    AlertEvent evaluate(String alertType, String title, String description,
                        String entityIds, String metadata);

    /**
     * Checks if a similar alert was fired recently (within clustering window).
     * Returns true if the new alert should be suppressed/clustered.
     */
    boolean isDuplicate(String alertType, String entityIds, int windowMinutes);
}
