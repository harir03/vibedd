package com.tatva.search.controller;

import com.tatva.search.dto.SearchResponse;
import com.tatva.search.service.IndexingService;
import com.tatva.search.service.SearchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests for the Search Service endpoints.
 * Uses @WebMvcTest — only web layer loaded, services are mocked.
 * No Elasticsearch connection required.
 */
@WebMvcTest({SearchController.class, com.tatva.search.controller.HealthController.class})
@ActiveProfiles("test")
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SearchService searchService;

    @MockitoBean
    private IndexingService indexingService;

    // ── Entity Search ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /search/entities?q=India → 200 with results")
    void searchEntitiesReturnsResults() throws Exception {
        var hit = new SearchResponse.SearchHit(
                "entity-1", "tatva-actors", 8.5,
                Map.of("canonicalName", "India", "domain", "Geopolitics"),
                Map.of("canonicalName", List.of("<em>India</em>"))
        );
        var response = new SearchResponse("India", 1, 0, 20, 12, List.of(hit));

        when(searchService.searchEntities(eq("India"), isNull(), isNull(), anyInt(), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/entities").param("q", "India"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("India"))
                .andExpect(jsonPath("$.totalHits").value(1))
                .andExpect(jsonPath("$.hits", hasSize(1)))
                .andExpect(jsonPath("$.hits[0].source.canonicalName").value("India"));
    }

    @Test
    @DisplayName("GET /search/entities?q=India&domain=Defense → filters by domain")
    void searchEntitiesWithDomainFilter() throws Exception {
        var hit = new SearchResponse.SearchHit(
                "entity-2", "tatva-actors", 7.0,
                Map.of("canonicalName", "Indian Navy", "domain", "Defense"),
                Map.of()
        );
        var response = new SearchResponse("India", 1, 0, 20, 8, List.of(hit));

        when(searchService.searchEntities(eq("India"), eq("Defense"), isNull(), anyInt(), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/entities")
                        .param("q", "India")
                        .param("domain", "Defense"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hits[0].source.domain").value("Defense"));
    }

    @Test
    @DisplayName("GET /search/entities without q param → 400")
    void searchEntitiesWithoutQueryReturns400() throws Exception {
        mockMvc.perform(get("/search/entities"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /search/entities with clearance header → passed to service")
    void searchEntitiesRespectsCleanerLevel() throws Exception {
        var response = new SearchResponse("DRDO", 0, 0, 20, 5, List.of());

        when(searchService.searchEntities(eq("DRDO"), isNull(), isNull(), eq(3), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/entities")
                        .param("q", "DRDO")
                        .header("X-Clearance-Level", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("DRDO"));
    }

    // ── Autocomplete ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /search/autocomplete?q=Ind → returns suggestions")
    void autocompleteReturnsSuggestions() throws Exception {
        var suggestions = List.<Map<String, Object>>of(
                Map.of("canonicalName", "India", "type", "Country", "_score", 9.0),
                Map.of("canonicalName", "Indian Navy", "type", "MilitaryUnit", "_score", 7.5),
                Map.of("canonicalName", "Indonesia", "type", "Country", "_score", 6.0)
        );

        when(searchService.autocomplete(eq("Ind"), anyInt(), anyInt()))
                .thenReturn(suggestions);

        mockMvc.perform(get("/search/autocomplete").param("q", "Ind"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].canonicalName").value("India"))
                .andExpect(jsonPath("$[1].canonicalName").value("Indian Navy"))
                .andExpect(jsonPath("$[2].canonicalName").value("Indonesia"));
    }

    @Test
    @DisplayName("GET /search/autocomplete without q → 400")
    void autocompleteWithoutPrefixReturns400() throws Exception {
        mockMvc.perform(get("/search/autocomplete"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /search/autocomplete?q=Ind&limit=5 → respects limit")
    void autocompleteRespectsLimit() throws Exception {
        when(searchService.autocomplete(eq("Ind"), anyInt(), eq(5)))
                .thenReturn(List.of(Map.of("canonicalName", "India")));

        mockMvc.perform(get("/search/autocomplete")
                        .param("q", "Ind")
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // ── Vector Similarity (kNN) ───────────────────────────────────────

    @Test
    @DisplayName("GET /search/similar/{id} → returns similar entities")
    void findSimilarReturnsSimilarEntities() throws Exception {
        var hit = new SearchResponse.SearchHit(
                "entity-3", "tatva-actors", 0.95,
                Map.of("canonicalName", "Pakistan", "domain", "Geopolitics"),
                Map.of()
        );
        var response = new SearchResponse("entity-1", 1, 0, 10, 45, List.of(hit));

        when(searchService.findSimilar(eq("entity-1"), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/similar/entity-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hits", hasSize(1)))
                .andExpect(jsonPath("$.hits[0].source.canonicalName").value("Pakistan"));
    }

    @Test
    @DisplayName("GET /search/similar/{id} with no embedding → empty results")
    void findSimilarNoEmbeddingReturnsEmpty() throws Exception {
        var response = new SearchResponse("entity-99", 0, 0, 10, 2, List.of());

        when(searchService.findSimilar(eq("entity-99"), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/similar/entity-99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHits").value(0))
                .andExpect(jsonPath("$.hits", hasSize(0)));
    }

    // ── Re-Index Trigger ──────────────────────────────────────────────

    @Test
    @DisplayName("POST /search/index → 200 with trigger status")
    void triggerReindexReturnsStatus() throws Exception {
        when(indexingService.triggerReindex()).thenReturn(Map.of(
                "status", "triggered",
                "message", "Re-indexing initiated"
        ));

        mockMvc.perform(post("/search/index"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("triggered"));
    }

    // ── Document Search ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /search/documents?q=defense+deal → 200 with results")
    void searchDocumentsReturnsResults() throws Exception {
        var hit = new SearchResponse.SearchHit(
                "doc-1", "tatva-documents", 6.5,
                Map.of("title", "India-France Defense Deal", "domain", "Defense"),
                Map.of("title", List.of("<em>defense</em> <em>deal</em>"))
        );
        var response = new SearchResponse("defense deal", 1, 0, 20, 18, List.of(hit));

        when(searchService.searchDocuments(eq("defense deal"), isNull(), anyInt(), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/documents").param("q", "defense deal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHits").value(1))
                .andExpect(jsonPath("$.hits[0].source.title").value("India-France Defense Deal"));
    }

    @Test
    @DisplayName("GET /search/documents without q → 400")
    void searchDocumentsWithoutQueryReturns400() throws Exception {
        mockMvc.perform(get("/search/documents"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /search/documents?q=trade&domain=Economics → filters by domain")
    void searchDocumentsWithDomainFilter() throws Exception {
        var response = new SearchResponse("trade", 0, 0, 20, 5, List.of());

        when(searchService.searchDocuments(eq("trade"), eq("Economics"), anyInt(), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/documents")
                        .param("q", "trade")
                        .param("domain", "Economics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query").value("trade"));
    }

    // ── Synonym / Fuzzy Search (via mock) ─────────────────────────────

    @Test
    @DisplayName("Synonym search: DRDO → also matches Defence Research and Development Organisation")
    void synonymSearchWorksThroughService() throws Exception {
        var hit = new SearchResponse.SearchHit(
                "entity-drdo", "tatva-actors", 9.0,
                Map.of("canonicalName", "Defence Research and Development Organisation",
                        "aliases", List.of("DRDO"), "domain", "Defense"),
                Map.of()
        );
        var response = new SearchResponse("DRDO", 1, 0, 20, 10, List.of(hit));

        when(searchService.searchEntities(eq("DRDO"), isNull(), isNull(), anyInt(), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/entities").param("q", "DRDO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hits[0].source.canonicalName")
                        .value("Defence Research and Development Organisation"));
    }

    @Test
    @DisplayName("Case-insensitive: 'defence minister' matches regardless of case")
    void caseInsensitiveSearchWorks() throws Exception {
        var hit = new SearchResponse.SearchHit(
                "entity-dm", "tatva-actors", 7.5,
                Map.of("canonicalName", "Defence Minister of India", "type", "PERSON"),
                Map.of()
        );
        var response = new SearchResponse("defence minister", 1, 0, 20, 8, List.of(hit));

        when(searchService.searchEntities(eq("defence minister"), isNull(), isNull(), anyInt(), anyInt(), anyInt()))
                .thenReturn(response);

        mockMvc.perform(get("/search/entities").param("q", "defence minister"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hits", hasSize(1)));
    }

    // ── Health ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/health → 200")
    void healthEndpointWorks() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("search-service"));
    }
}
