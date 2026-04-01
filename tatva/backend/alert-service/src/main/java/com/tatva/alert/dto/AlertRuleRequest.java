package com.tatva.alert.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

public record AlertRuleRequest(

        @NotNull(message = "userId is required")
        UUID userId,

        @NotBlank(message = "name is required")
        String name,

        @NotBlank(message = "alertType is required")
        @Pattern(regexp = "ENTITY_ALERT|RELATIONSHIP_ALERT|ANOMALY_ALERT|CONTRADICTION_ALERT|THRESHOLD_ALERT|TREND_ALERT",
                message = "Invalid alert type")
        String alertType,

        String conditions,

        String channels,

        @Pattern(regexp = "INFO|WARNING|CRITICAL|FLASH",
                message = "Priority must be INFO, WARNING, CRITICAL, or FLASH")
        String priority
) {}
