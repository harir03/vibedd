package com.tatva.graph.dto;

import java.util.List;

/**
 * Response DTO for N-hop neighborhood queries.
 * Contains the center entity, all discovered nodes, and edges.
 */
public record NeighborhoodResponse(
        String centerId,
        int depth,
        List<EntityResponse> nodes,
        List<RelationshipResponse> edges,
        int nodeCount,
        int edgeCount
) {
}
