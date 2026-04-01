package com.tatva.alert.dto;

import java.time.Instant;
import java.util.UUID;

public record AlertRuleResponse(
        UUID id,
        UUID userId,
        String name,
        String alertType,
        String conditions,
        String channels,
        String priority,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
