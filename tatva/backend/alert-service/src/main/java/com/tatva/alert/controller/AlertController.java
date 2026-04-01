package com.tatva.alert.controller;

import com.tatva.alert.dto.AlertEventResponse;
import com.tatva.alert.dto.AlertRuleRequest;
import com.tatva.alert.dto.AlertRuleResponse;
import com.tatva.alert.service.AlertService;
import com.tatva.alert.websocket.AlertBroadcaster;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;
    private final AlertBroadcaster broadcaster;

    public AlertController(AlertService alertService, AlertBroadcaster broadcaster) {
        this.alertService = alertService;
        this.broadcaster = broadcaster;
    }

    /** Create a new alert rule. */
    @PostMapping("/rules")
    public ResponseEntity<AlertRuleResponse> createRule(@Valid @RequestBody AlertRuleRequest request) {
        AlertRuleResponse created = alertService.createRule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** List all alert rules for a user. */
    @GetMapping("/rules")
    public ResponseEntity<List<AlertRuleResponse>> listRules(@RequestParam("userId") UUID userId) {
        return ResponseEntity.ok(alertService.listRules(userId));
    }

    /** Delete an alert rule. */
    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable("id") UUID id) {
        alertService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    /** Get fired alert events (paginated, optionally filtered by status). */
    @GetMapping("/events")
    public ResponseEntity<Page<AlertEventResponse>> getEvents(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(alertService.getEvents(status, page, size));
    }

    /** Acknowledge a fired alert event. */
    @PutMapping("/events/{id}/acknowledge")
    public ResponseEntity<AlertEventResponse> acknowledgeEvent(
            @PathVariable("id") Long id,
            @RequestParam("userId") UUID userId) {
        return ResponseEntity.ok(alertService.acknowledgeEvent(id, userId));
    }

    /** WebSocket status — number of connected clients. */
    @GetMapping("/ws/status")
    public ResponseEntity<Map<String, Object>> wsStatus() {
        return ResponseEntity.ok(Map.of(
                "connectedClients", broadcaster.getActiveSessionCount()
        ));
    }
}
