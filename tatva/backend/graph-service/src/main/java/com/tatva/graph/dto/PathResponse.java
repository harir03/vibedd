package com.tatva.graph.dto;

import java.util.List;

/**
 * Response DTO for shortest-path queries between two entities.
 */
public record PathResponse(
        String fromId,
        String toId,
        List<EntityResponse> nodes,
        List<RelationshipResponse> edges,
        int pathLength
) {
}
