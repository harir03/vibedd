package com.tatva.alert.dto;

import java.time.Instant;
import java.util.UUID;

public record AlertEventResponse(
        Long id,
        UUID ruleId,
        String alertType,
        String priority,
        String title,
        String description,
        String entityIds,
        String status,
        UUID acknowledgedBy,
        Instant acknowledgedAt,
        Instant firedAt,
        String metadata
) {}
