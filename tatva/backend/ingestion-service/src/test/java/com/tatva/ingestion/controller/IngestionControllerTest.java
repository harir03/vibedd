package com.tatva.ingestion.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.ingestion.dto.IngestionRunResponse;
import com.tatva.ingestion.dto.SourceRequest;
import com.tatva.ingestion.dto.SourceResponse;
import com.tatva.ingestion.service.IngestionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests for the Ingestion Service endpoints.
 * Uses @WebMvcTest — only web layer loaded, services are mocked.
 */
@WebMvcTest({IngestionController.class, HealthController.class})
@ActiveProfiles("test")
class IngestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IngestionService ingestionService;

    // ── POST /ingest/sources ──────────────────────────────────────────

    @Test
    @DisplayName("POST /ingest/sources → 201 with created source")
    void createSourceReturns201() throws Exception {
        var sourceId = UUID.randomUUID();
        var response = new SourceResponse(
                sourceId, "Reuters RSS", "RSS", "https://feeds.reuters.com/news",
                1, "Geopolitics", null, null, true
        );
        when(ingestionService.createSource(any())).thenReturn(response);

        var request = new SourceRequest(
                "Reuters RSS", "RSS", "https://feeds.reuters.com/news",
                1, "Geopolitics", null
        );

        mockMvc.perform(post("/ingest/sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Reuters RSS"))
                .andExpect(jsonPath("$.sourceType").value("RSS"))
                .andExpect(jsonPath("$.reliabilityTier").value(1))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("POST /ingest/sources with missing name → 400")
    void createSourceWithoutNameReturns400() throws Exception {
        String json = """
                {
                  "sourceType": "RSS",
                  "url": "https://example.com/feed"
                }
                """;

        mockMvc.perform(post("/ingest/sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /ingest/sources with missing URL → 400")
    void createSourceWithoutUrlReturns400() throws Exception {
        String json = """
                {
                  "name": "Test Feed",
                  "sourceType": "RSS"
                }
                """;

        mockMvc.perform(post("/ingest/sources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // ── GET /ingest/sources ───────────────────────────────────────────

    @Test
    @DisplayName("GET /ingest/sources → 200 with source list")
    void listSourcesReturns200() throws Exception {
        var sources = List.of(
                new SourceResponse(UUID.randomUUID(), "Reuters", "RSS",
                        "https://feeds.reuters.com", 1, "Geopolitics", null, null, true),
                new SourceResponse(UUID.randomUUID(), "PTI", "RSS",
                        "https://feeds.pti.in", 1, "Geopolitics", null, null, true)
        );
        when(ingestionService.listSources()).thenReturn(sources);

        mockMvc.perform(get("/ingest/sources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Reuters"))
                .andExpect(jsonPath("$[1].name").value("PTI"));
    }

    // ── POST /ingest/trigger ──────────────────────────────────────────

    @Test
    @DisplayName("POST /ingest/trigger?sourceId=... → 200 with run summary")
    void triggerIngestionReturns200() throws Exception {
        var sourceId = UUID.randomUUID();
        when(ingestionService.triggerIngestion(eq(sourceId))).thenReturn(Map.of(
                "sourceId", sourceId.toString(),
                "status", "success",
                "fetched", 15,
                "published", 12,
                "duplicatesSkipped", 3
        ));

        mockMvc.perform(post("/ingest/trigger")
                        .param("sourceId", sourceId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.fetched").value(15))
                .andExpect(jsonPath("$.published").value(12))
                .andExpect(jsonPath("$.duplicatesSkipped").value(3));
    }

    @Test
    @DisplayName("POST /ingest/trigger without sourceId → 400")
    void triggerWithoutSourceIdReturns400() throws Exception {
        mockMvc.perform(post("/ingest/trigger"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /ingest/trigger-all ──────────────────────────────────────

    @Test
    @DisplayName("POST /ingest/trigger-all → 200 with summary")
    void triggerAllReturns200() throws Exception {
        when(ingestionService.triggerAll()).thenReturn(Map.of(
                "totalSources", 3,
                "triggeredAt", Instant.now().toString()
        ));

        mockMvc.perform(post("/ingest/trigger-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSources").value(3));
    }

    // ── GET /ingest/runs ──────────────────────────────────────────────

    @Test
    @DisplayName("GET /ingest/runs → 200 with run history")
    void getRecentRunsReturns200() throws Exception {
        var runs = List.of(
                new IngestionRunResponse(
                        UUID.randomUUID(), UUID.randomUUID(), "Reuters",
                        Instant.now().minusSeconds(3600), Instant.now().minusSeconds(3500),
                        "success", 20, 15, 8, null
                )
        );
        when(ingestionService.getRecentRuns(anyInt())).thenReturn(runs);

        mockMvc.perform(get("/ingest/runs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("success"))
                .andExpect(jsonPath("$[0].documentsFetched").value(20));
    }

    // ── Health ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/health → 200")
    void healthEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("ingestion-service"));
    }
}
