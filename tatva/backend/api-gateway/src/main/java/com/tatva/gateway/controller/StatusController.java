package com.tatva.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Public status endpoint — no authentication required.
 * Returns system status information for health monitoring.
 */
@RestController
public class StatusController {

    @GetMapping("/api/status")
    public Map<String, Object> status() {
        return Map.of(
                "system", "TATVA Intelligence Platform",
                "version", "1.0.0-SNAPSHOT",
                "status", "OPERATIONAL",
                "timestamp", Instant.now().toString(),
                "services", Map.of(
                        "api-gateway", "UP",
                        "graph-service", "UNKNOWN",
                        "search-service", "UNKNOWN",
                        "ingestion-service", "UNKNOWN",
                        "analytics-service", "UNKNOWN",
                        "alert-service", "UNKNOWN",
                        "audit-service", "UNKNOWN",
                        "nlp-service", "UNKNOWN",
                        "reasoning-service", "UNKNOWN"
                )
        );
    }
}
