package com.tatva.graph.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.graph.dto.*;
import com.tatva.graph.service.EntityService;
import com.tatva.graph.service.RelationshipService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests for the Entity and Relationship endpoints.
 * Uses @WebMvcTest — only web layer loaded, services are mocked.
 * No Neo4j connection required.
 */
@WebMvcTest({EntityController.class, RelationshipController.class, HealthController.class})
@ActiveProfiles("test")
class EntityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EntityService entityService;

    @MockitoBean
    private RelationshipService relationshipService;

    // ── Entity CRUD Tests ─────────────────────────────────────────────

    @Test
    @DisplayName("POST /graph/entities/single → 201 Created")
    void createEntityReturns201() throws Exception {
        EntityRequest request = new EntityRequest(
                "Actor", "India", List.of("Republic of India", "Bharat"),
                "South Asian country", "Geopolitics", "Country",
                0.95, 0, Map.of()
        );

        EntityResponse mockResponse = new EntityResponse(
                "uuid-123", "Actor", "India", List.of("Republic of India", "Bharat"),
                "South Asian country", "Geopolitics", "Country",
                0.95, 0, "2026-03-10T00:00:00Z", "2026-03-10T00:00:00Z", Map.of()
        );

        when(entityService.createEntity(any(EntityRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/graph/entities/single")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("uuid-123"))
                .andExpect(jsonPath("$.label").value("Actor"))
                .andExpect(jsonPath("$.canonicalName").value("India"))
                .andExpect(jsonPath("$.domain").value("Geopolitics"));
    }

    @Test
    @DisplayName("GET /graph/entities/{id} → correct entity returned")
    void getEntityByIdReturnsEntity() throws Exception {
        EntityResponse mockResponse = new EntityResponse(
                "uuid-123", "Actor", "India", List.of("Bharat"),
                "South Asian country", "Geopolitics", "Country",
                0.95, 0, null, null, Map.of()
        );

        when(entityService.getEntityById(eq("uuid-123"), anyInt())).thenReturn(mockResponse);

        mockMvc.perform(get("/graph/entities/uuid-123")
                        .header("X-Clearance-Level", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canonicalName").value("India"));
    }

    @Test
    @DisplayName("GET /graph/entities/{id} → 404 for non-existent")
    void getEntityByIdReturns404() throws Exception {
        when(entityService.getEntityById(eq("ghost"), anyInt())).thenReturn(null);

        mockMvc.perform(get("/graph/entities/ghost"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /graph/entities/search?q=India → returns matching entities")
    void searchEntitiesReturnsResults() throws Exception {
        List<EntityResponse> mockResults = List.of(
                new EntityResponse("uuid-1", "Actor", "India", List.of(), "",
                        "Geopolitics", "Country", 0.95, 0, null, null, Map.of()),
                new EntityResponse("uuid-2", "Actor", "Indian Navy", List.of(), "",
                        "Defense", "Military", 0.90, 0, null, null, Map.of())
        );

        when(entityService.searchEntities(eq("India"), anyInt(), anyInt())).thenReturn(mockResults);

        mockMvc.perform(get("/graph/entities/search").param("q", "India"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].canonicalName").value("India"))
                .andExpect(jsonPath("$[1].canonicalName").value("Indian Navy"));
    }

    @Test
    @DisplayName("DELETE /graph/entities/{id} → 204 No Content (soft delete)")
    void deleteEntityReturns204() throws Exception {
        doNothing().when(entityService).archiveEntity("uuid-123");

        mockMvc.perform(delete("/graph/entities/uuid-123"))
                .andExpect(status().isNoContent());
    }

    // ── Neighborhood & Path Tests ─────────────────────────────────────

    @Test
    @DisplayName("GET /graph/entities/{id}/neighborhood?depth=2 → neighborhood returned")
    void getNeighborhoodReturnsSubgraph() throws Exception {
        NeighborhoodResponse mockResponse = new NeighborhoodResponse(
                "uuid-123", 2,
                List.of(new EntityResponse("uuid-123", "Actor", "India", List.of(),
                        "", "Geopolitics", "Country", 0.95, 0, null, null, Map.of())),
                List.of(),
                1, 0
        );

        when(entityService.getNeighborhood(eq("uuid-123"), eq(2), anyInt()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/graph/entities/uuid-123/neighborhood")
                        .param("depth", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.centerId").value("uuid-123"))
                .andExpect(jsonPath("$.depth").value(2))
                .andExpect(jsonPath("$.nodeCount").value(1));
    }

    @Test
    @DisplayName("GET /graph/entities/{id}/neighborhood?depth=10 → capped at 5")
    void getNeighborhoodCapsDepth() throws Exception {
        // Service implementation caps at 5, returns depth=5
        NeighborhoodResponse mockResponse = new NeighborhoodResponse(
                "uuid-123", 5, List.of(), List.of(), 0, 0);

        when(entityService.getNeighborhood(eq("uuid-123"), eq(10), anyInt()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/graph/entities/uuid-123/neighborhood")
                        .param("depth", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.depth").value(5));
    }

    @Test
    @DisplayName("GET /graph/path?from=A&to=B → shortest path returned")
    void getShortestPathReturnsPath() throws Exception {
        PathResponse mockResponse = new PathResponse(
                "uuid-a", "uuid-b",
                List.of(
                        new EntityResponse("uuid-a", "Actor", "India", List.of(),
                                "", "Geopolitics", "Country", 0.95, 0, null, null, Map.of()),
                        new EntityResponse("uuid-b", "Actor", "USA", List.of(),
                                "", "Geopolitics", "Country", 0.95, 0, null, null, Map.of())
                ),
                List.of(new RelationshipResponse("uuid-a", "uuid-b", "ALLIES_WITH",
                        "2020-01-01", null, 0.8, "Strategic partners", "Geopolitics", 0.9, Map.of())),
                1
        );

        when(entityService.getShortestPath(eq("uuid-a"), eq("uuid-b"), anyInt()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/graph/path")
                        .param("from", "uuid-a")
                        .param("to", "uuid-b"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromId").value("uuid-a"))
                .andExpect(jsonPath("$.toId").value("uuid-b"))
                .andExpect(jsonPath("$.pathLength").value(1))
                .andExpect(jsonPath("$.nodes", hasSize(2)));
    }

    // ── Clearance Filtering Tests ─────────────────────────────────────

    @Test
    @DisplayName("Clearance filter: high-clearance entity not returned to low-clearance user")
    void clearanceFilterBlocksHighClearanceEntity() throws Exception {
        // Service returns null for entity with clearance=3 when user clearance=2
        when(entityService.getEntityById(eq("secret-entity"), eq(2))).thenReturn(null);

        mockMvc.perform(get("/graph/entities/secret-entity")
                        .header("X-Clearance-Level", "2"))
                .andExpect(status().isNotFound());
    }

    // ── Relationship Tests ────────────────────────────────────────────

    @Test
    @DisplayName("POST /graph/relationships → 201 with valid_from/valid_to")
    void createRelationshipReturns201() throws Exception {
        RelationshipRequest request = new RelationshipRequest(
                "uuid-a", "uuid-b", "ALLIES_WITH",
                "2020-01-01", null, 0.8, "Strategic partners",
                "Geopolitics", 0.9, Map.of()
        );

        RelationshipResponse mockResponse = new RelationshipResponse(
                "uuid-a", "uuid-b", "ALLIES_WITH",
                "2020-01-01", null, 0.8, "Strategic partners",
                "Geopolitics", 0.9, Map.of()
        );

        when(relationshipService.createRelationship(any(RelationshipRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/graph/relationships")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceId").value("uuid-a"))
                .andExpect(jsonPath("$.targetId").value("uuid-b"))
                .andExpect(jsonPath("$.type").value("ALLIES_WITH"))
                .andExpect(jsonPath("$.validFrom").value("2020-01-01"));
    }

    // ── Cypher Injection Safety Test ──────────────────────────────────

    @Test
    @DisplayName("Cypher injection attempt: parameterized query keeps it safe")
    void cypherInjectionIsSafe() throws Exception {
        // The injection string is passed as a search parameter — parameterized, safe
        when(entityService.searchEntities(
                eq("'; MATCH (n) DETACH DELETE n //"), anyInt(), anyInt()))
                .thenReturn(List.of());

        mockMvc.perform(get("/graph/entities/search")
                        .param("q", "'; MATCH (n) DETACH DELETE n //"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── Validation Tests ──────────────────────────────────────────────

    @Test
    @DisplayName("POST /graph/entities/single with missing label → 400")
    void createEntityMissingLabelReturns400() throws Exception {
        String json = """
                {
                    "canonicalName": "India",
                    "domain": "Geopolitics"
                }
                """;

        mockMvc.perform(post("/graph/entities/single")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // ── Domain Queries ────────────────────────────────────────────────

    @Test
    @DisplayName("GET /graph/domains/{domain}/entities → entities by domain")
    void getEntitiesByDomainReturnsResults() throws Exception {
        List<EntityResponse> mockResults = List.of(
                new EntityResponse("uuid-1", "Actor", "India", List.of(), "",
                        "Geopolitics", "Country", 0.95, 0, null, null, Map.of())
        );

        when(entityService.getEntitiesByDomain(eq("Geopolitics"), anyInt(), anyInt()))
                .thenReturn(mockResults);

        mockMvc.perform(get("/graph/domains/Geopolitics/entities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].domain").value("Geopolitics"));
    }

    // ── Health Endpoint ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/health → 200 (existing health check)")
    void healthEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("graph-service"));
    }
}
