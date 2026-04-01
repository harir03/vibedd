package com.tatva.search.service;

import com.tatva.search.dto.SearchResponse;

import java.util.List;
import java.util.Map;

/**
 * Service interface for Elasticsearch search operations.
 */
public interface SearchService {

    /**
     * Full-text search across entity indices with synonym support,
     * filtered by clearance level.
     */
    SearchResponse searchEntities(String query, String domain, String type,
                                  int clearanceLevel, int page, int size);

    /**
     * Autocomplete using edge n-gram analyzer for prefix matching.
     */
    List<Map<String, Object>> autocomplete(String prefix, int clearanceLevel, int limit);

    /**
     * Vector similarity search (kNN) for finding entities similar
     * to the given entity ID.
     */
    SearchResponse findSimilar(String entityId, int clearanceLevel, int topK);

    /**
     * Full-text search across the documents index.
     */
    SearchResponse searchDocuments(String query, String domain,
                                   int clearanceLevel, int page, int size);
}
