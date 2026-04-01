package com.tatva.ingestion.service;

import com.tatva.ingestion.dto.IngestionRunResponse;
import com.tatva.ingestion.dto.SourceRequest;
import com.tatva.ingestion.dto.SourceResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service interface for ingestion operations.
 */
public interface IngestionService {

    /**
     * Register a new data source.
     */
    SourceResponse createSource(SourceRequest request);

    /**
     * List all registered sources.
     */
    List<SourceResponse> listSources();

    /**
     * Trigger ingestion for a specific source.
     *
     * @return summary of the ingestion run
     */
    Map<String, Object> triggerIngestion(UUID sourceId);

    /**
     * Trigger ingestion for ALL active sources.
     *
     * @return summary of all triggered runs
     */
    Map<String, Object> triggerAll();

    /**
     * Get recent ingestion run history.
     */
    List<IngestionRunResponse> getRecentRuns(int limit);
}
