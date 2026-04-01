package com.tatva.graph.service;

import com.tatva.graph.dto.RelationshipRequest;
import com.tatva.graph.dto.RelationshipResponse;

/**
 * Service interface for knowledge graph relationship operations.
 */
public interface RelationshipService {

    RelationshipResponse createRelationship(RelationshipRequest request);
}
