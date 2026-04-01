package com.tatva.search.service;

import java.util.Map;

/**
 * Service interface for indexing entities from Neo4j into Elasticsearch.
 */
public interface IndexingService {

    /**
     * Trigger a full re-index of all entities from Neo4j into Elasticsearch.
     * Returns a summary of the indexing operation.
     */
    Map<String, Object> triggerReindex();

    /**
     * Index a single entity document into the appropriate ES index.
     *
     * @param index    the target ES index name (e.g. "tatva-actors")
     * @param id       the document ID
     * @param document the document body
     */
    void indexDocument(String index, String id, Map<String, Object> document);

    /**
     * Delete a single document from the given ES index.
     */
    void deleteDocument(String index, String id);
}
