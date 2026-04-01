package com.tatva.graph.service;

import com.tatva.graph.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for knowledge graph entity operations.
 * All read operations filter by user clearance level.
 */
public interface EntityService {

    EntityResponse createEntity(EntityRequest request);

    List<EntityResponse> batchCreateEntities(List<EntityRequest> requests);

    EntityResponse getEntityById(String id, int userClearance);

    List<EntityResponse> searchEntities(String query, int userClearance, int limit);

    EntityResponse updateEntity(String id, EntityRequest request);

    void archiveEntity(String id);

    NeighborhoodResponse getNeighborhood(String id, int depth, int userClearance);

    PathResponse getShortestPath(String fromId, String toId, int userClearance);

    List<EntityResponse> getEntitiesByDomain(String domain, int userClearance, int limit);

    List<RelationshipResponse> getEntityTimeline(String id, int userClearance);
}
