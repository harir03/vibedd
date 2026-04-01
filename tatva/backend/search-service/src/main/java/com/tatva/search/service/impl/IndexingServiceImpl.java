package com.tatva.search.service.impl;

import com.tatva.search.service.IndexingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import co.elastic.clients.elasticsearch.core.bulk.BulkResponseItem;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Service for indexing entity data into Elasticsearch.
 * In production, triggerReindex() would read from Neo4j and bulk-index.
 * For T1-F4, this provides the scaffolding + single-doc indexing.
 */
@Service
public class IndexingServiceImpl implements IndexingService {

    private static final Logger log = LoggerFactory.getLogger(IndexingServiceImpl.class);

    private final ElasticsearchClient esClient;

    public IndexingServiceImpl(ElasticsearchClient esClient) {
        this.esClient = esClient;
    }

    @Override
    public Map<String, Object> triggerReindex() {
        // In production, this would:
        // 1. Query all entities from Neo4j
        // 2. Transform to ES documents
        // 3. Bulk index into appropriate ES indices
        // For now, return a status indicating the reindex was triggered.
        log.info("Re-index triggered at {}", Instant.now());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "triggered");
        result.put("triggeredAt", Instant.now().toString());
        result.put("message", "Re-indexing from Neo4j to Elasticsearch has been initiated");
        return result;
    }

    @Override
    public void indexDocument(String index, String id, Map<String, Object> document) {
        try {
            esClient.index(i -> i
                    .index(index)
                    .id(id)
                    .document(document)
            );
            log.debug("Indexed document {} into {}", id, index);
        } catch (IOException e) {
            log.error("Failed to index document {} into {}: {}", id, index, e.getMessage(), e);
            throw new RuntimeException("Indexing failed for document " + id, e);
        }
    }

    @Override
    public void deleteDocument(String index, String id) {
        try {
            esClient.delete(d -> d
                    .index(index)
                    .id(id)
            );
            log.debug("Deleted document {} from {}", id, index);
        } catch (IOException e) {
            log.error("Failed to delete document {} from {}: {}", id, index, e.getMessage(), e);
            throw new RuntimeException("Deletion failed for document " + id, e);
        }
    }
}
