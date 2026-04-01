package com.tatva.alert.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.alert.dto.AlertEventResponse;
import com.tatva.alert.dto.AlertRuleRequest;
import com.tatva.alert.dto.AlertRuleResponse;
import com.tatva.alert.exception.GlobalExceptionHandler;
import com.tatva.alert.service.AlertService;
import com.tatva.alert.websocket.AlertBroadcaster;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({AlertController.class, HealthController.class})
@ActiveProfiles("test")
class AlertControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AlertService alertService;

    @MockitoBean
    private AlertBroadcaster broadcaster;

    private final UUID testUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");

    // --- Rule CRUD tests ---

    @Test
    @DisplayName("POST /api/alerts/rules → 201 Created")
    void createRuleReturns201() throws Exception {
        AlertRuleRequest request = new AlertRuleRequest(
                testUserId, "Track India", "ENTITY_ALERT",
                "{\"entityName\": \"India\"}", "[\"DASHBOARD\"]", "INFO");

        AlertRuleResponse response = new AlertRuleResponse(
                UUID.randomUUID(), testUserId, "Track India", "ENTITY_ALERT",
                "{\"entityName\": \"India\"}", "[\"DASHBOARD\"]", "INFO",
                true, Instant.now(), Instant.now());

        when(alertService.createRule(any())).thenReturn(response);

        mockMvc.perform(post("/api/alerts/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Track India"))
                .andExpect(jsonPath("$.alertType").value("ENTITY_ALERT"));
    }

    @Test
    @DisplayName("POST /api/alerts/rules with missing name → 400")
    void createRuleWithoutNameReturns400() throws Exception {
        AlertRuleRequest request = new AlertRuleRequest(
                testUserId, "", "ENTITY_ALERT", null, null, null);

        mockMvc.perform(post("/api/alerts/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/alerts/rules with invalid alertType → 400")
    void createRuleWithInvalidTypeReturns400() throws Exception {
        AlertRuleRequest request = new AlertRuleRequest(
                testUserId, "Bad Rule", "INVALID_TYPE", null, null, null);

        mockMvc.perform(post("/api/alerts/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/alerts/rules with invalid priority → 400")
    void createRuleWithInvalidPriorityReturns400() throws Exception {
        AlertRuleRequest request = new AlertRuleRequest(
                testUserId, "Rule", "ENTITY_ALERT", null, null, "EXTREME");

        mockMvc.perform(post("/api/alerts/rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/alerts/rules?userId=... → 200 with rules list")
    void listRulesReturns200() throws Exception {
        AlertRuleResponse rule = new AlertRuleResponse(
                UUID.randomUUID(), testUserId, "Track India", "ENTITY_ALERT",
                "{}", "[\"DASHBOARD\"]", "INFO", true, Instant.now(), Instant.now());

        when(alertService.listRules(testUserId)).thenReturn(List.of(rule));

        mockMvc.perform(get("/api/alerts/rules")
                        .param("userId", testUserId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Track India"));
    }

    @Test
    @DisplayName("DELETE /api/alerts/rules/{id} → 204 No Content")
    void deleteRuleReturns204() throws Exception {
        UUID ruleId = UUID.randomUUID();
        doNothing().when(alertService).deleteRule(ruleId);

        mockMvc.perform(delete("/api/alerts/rules/" + ruleId))
                .andExpect(status().isNoContent());
    }

    // --- Event tests ---

    @Test
    @DisplayName("GET /api/alerts/events → 200 with paginated events")
    void getEventsReturns200() throws Exception {
        AlertEventResponse event = new AlertEventResponse(
                1L, null, "ENTITY_ALERT", "INFO", "India update",
                "New article about India", "[\"e1\"]", "NEW",
                null, null, Instant.now(), "{}");

        Page<AlertEventResponse> page = new PageImpl<>(
                List.of(event), PageRequest.of(0, 20), 1);

        when(alertService.getEvents(isNull(), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(get("/api/alerts/events")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("India update"))
                .andExpect(jsonPath("$.content[0].status").value("NEW"));
    }

    @Test
    @DisplayName("GET /api/alerts/events?status=NEW → filtered events")
    void getEventsFilteredByStatusReturns200() throws Exception {
        Page<AlertEventResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);

        when(alertService.getEvents(eq("NEW"), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(get("/api/alerts/events")
                        .param("status", "NEW"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("PUT /api/alerts/events/{id}/acknowledge → 200 with ACKNOWLEDGED status")
    void acknowledgeEventReturns200() throws Exception {
        AlertEventResponse acked = new AlertEventResponse(
                1L, null, "ENTITY_ALERT", "INFO", "India update",
                "desc", "[\"e1\"]", "ACKNOWLEDGED",
                testUserId, Instant.now(), Instant.now(), "{}");

        when(alertService.acknowledgeEvent(eq(1L), eq(testUserId))).thenReturn(acked);

        mockMvc.perform(put("/api/alerts/events/1/acknowledge")
                        .param("userId", testUserId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.acknowledgedBy").value(testUserId.toString()));
    }

    // --- WebSocket status ---

    @Test
    @DisplayName("GET /api/alerts/ws/status → 200 with connected client count")
    void wsStatusReturns200() throws Exception {
        when(broadcaster.getActiveSessionCount()).thenReturn(5);

        mockMvc.perform(get("/api/alerts/ws/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connectedClients").value(5));
    }

    // --- Health ---

    @Test
    @DisplayName("GET /api/health → 200 with alert-service name")
    void healthEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("alert-service"));
    }

    // --- Alert type validation coverage ---

    @Test
    @DisplayName("POST rule with all valid alert types succeeds")
    void allValidAlertTypesAccepted() throws Exception {
        String[] validTypes = {"ENTITY_ALERT", "RELATIONSHIP_ALERT", "ANOMALY_ALERT",
                "CONTRADICTION_ALERT", "THRESHOLD_ALERT", "TREND_ALERT"};

        for (String type : validTypes) {
            AlertRuleRequest request = new AlertRuleRequest(
                    testUserId, "Rule-" + type, type, "{}", null, "WARNING");

            AlertRuleResponse response = new AlertRuleResponse(
                    UUID.randomUUID(), testUserId, "Rule-" + type, type,
                    "{}", "[\"DASHBOARD\"]", "WARNING", true, Instant.now(), Instant.now());

            when(alertService.createRule(any())).thenReturn(response);

            mockMvc.perform(post("/api/alerts/rules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }
    }
}
