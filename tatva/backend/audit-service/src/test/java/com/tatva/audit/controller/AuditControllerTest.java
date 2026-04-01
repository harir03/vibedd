package com.tatva.audit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.audit.dto.AuditLogRequest;
import com.tatva.audit.model.AuditLog;
import com.tatva.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Audit Controller.
 * Uses H2 in-memory database with Kafka disabled.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository repository;

    private static final UUID TEST_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    // ── Create Audit Log ──────────────────────────────────────────────

    @Test
    @DisplayName("POST /audit/log → 201 Created with all fields")
    void createAuditLogReturns201() throws Exception {
        AuditLogRequest request = new AuditLogRequest(
                TEST_USER_ID, "CREATE", "ENTITY", "ent-001",
                null, "{\"name\":\"India\"}", "192.168.1.1", "Mozilla/5.0",
                UUID.randomUUID(), null, null
        );

        mockMvc.perform(post("/audit/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.action").value("CREATE"))
                .andExpect(jsonPath("$.resourceType").value("ENTITY"))
                .andExpect(jsonPath("$.resourceId").value("ent-001"))
                .andExpect(jsonPath("$.userId").value(TEST_USER_ID.toString()))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.newValue").value("{\"name\":\"India\"}"));
    }

    @Test
    @DisplayName("POST /audit/log with missing action → 400 validation error")
    void createAuditLogMissingActionReturns400() throws Exception {
        String json = """
                {
                    "resourceType": "ENTITY",
                    "resourceId": "ent-001"
                }
                """;

        mockMvc.perform(post("/audit/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /audit/log DELETE without justification → 400")
    void deleteWithoutJustificationReturns400() throws Exception {
        AuditLogRequest request = new AuditLogRequest(
                TEST_USER_ID, "DELETE", "ENTITY", "ent-001",
                "{\"name\":\"India\"}", null, "192.168.1.1", "Mozilla/5.0",
                UUID.randomUUID(), null, null
        );

        mockMvc.perform(post("/audit/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /audit/log DELETE with justification → 201")
    void deleteWithJustificationReturns201() throws Exception {
        AuditLogRequest request = new AuditLogRequest(
                TEST_USER_ID, "DELETE", "ENTITY", "ent-001",
                "{\"name\":\"India\"}", null, "192.168.1.1", "Mozilla/5.0",
                UUID.randomUUID(), "Duplicate entity — approved by admin", null
        );

        mockMvc.perform(post("/audit/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.justification").value("Duplicate entity — approved by admin"));
    }

    // ── Query Audit Logs ──────────────────────────────────────────────

    @Test
    @DisplayName("GET /audit/logs → paginated list of all entries")
    void getAuditLogsReturnsPaginatedList() throws Exception {
        seedAuditLog("CREATE", "ENTITY", "ent-001");
        seedAuditLog("UPDATE", "ENTITY", "ent-002");
        seedAuditLog("LOGIN", "SESSION", null);

        mockMvc.perform(get("/audit/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    @DisplayName("GET /audit/logs?action=LOGIN → filtered by action")
    void getAuditLogsFilteredByAction() throws Exception {
        seedAuditLog("CREATE", "ENTITY", "ent-001");
        seedAuditLog("LOGIN", "SESSION", null);
        seedAuditLog("LOGIN", "SESSION", null);

        mockMvc.perform(get("/audit/logs").param("action", "LOGIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].action").value("LOGIN"));
    }

    @Test
    @DisplayName("GET /audit/logs?resourceType=ENTITY → filtered by resource type")
    void getAuditLogsFilteredByResourceType() throws Exception {
        seedAuditLog("CREATE", "ENTITY", "ent-001");
        seedAuditLog("LOGIN", "SESSION", null);

        mockMvc.perform(get("/audit/logs").param("resourceType", "ENTITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].resourceType").value("ENTITY"));
    }

    // ── Single Entry ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /audit/logs/{id} → single audit entry")
    void getAuditLogByIdReturnsSingleEntry() throws Exception {
        AuditLog saved = seedAuditLog("CREATE", "ENTITY", "ent-001");

        mockMvc.perform(get("/audit/logs/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.action").value("CREATE"));
    }

    @Test
    @DisplayName("GET /audit/logs/{id} → 404 for non-existent entry")
    void getAuditLogByIdReturns404() throws Exception {
        mockMvc.perform(get("/audit/logs/{id}", 99999L))
                .andExpect(status().isNotFound());
    }

    // ── Entity-specific Audit Trail ───────────────────────────────────

    @Test
    @DisplayName("GET /audit/logs/entity/{entityId} → all entries for entity")
    void getAuditLogsByEntityId() throws Exception {
        seedAuditLog("CREATE", "ENTITY", "ent-001");
        seedAuditLog("UPDATE", "ENTITY", "ent-001");
        seedAuditLog("CREATE", "ENTITY", "ent-002");

        mockMvc.perform(get("/audit/logs/entity/{entityId}", "ent-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    // ── User-specific Audit Trail ─────────────────────────────────────

    @Test
    @DisplayName("GET /audit/logs/user/{userId} → all entries by user")
    void getAuditLogsByUserId() throws Exception {
        seedAuditLog("CREATE", "ENTITY", "ent-001");
        seedAuditLog("LOGIN", "SESSION", null);

        mockMvc.perform(get("/audit/logs/user/{userId}", TEST_USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    // ── Health Endpoint ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/health → 200 (existing health check still works)")
    void healthEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("audit-service"))
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // ── Test Helper ───────────────────────────────────────────────────

    private AuditLog seedAuditLog(String action, String resourceType, String resourceId) {
        AuditLog log = new AuditLog();
        log.setTimestamp(Instant.now());
        log.setUserId(TEST_USER_ID);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        return repository.save(log);
    }
}
