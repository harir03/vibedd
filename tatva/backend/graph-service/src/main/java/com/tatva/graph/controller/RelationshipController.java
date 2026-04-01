package com.tatva.graph.controller;

import com.tatva.graph.dto.RelationshipRequest;
import com.tatva.graph.dto.RelationshipResponse;
import com.tatva.graph.service.RelationshipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for knowledge graph relationship operations.
 */
@RestController
@RequestMapping("/graph/relationships")
@Tag(name = "Graph Relationships", description = "Create and manage typed relationships in the knowledge graph")
public class RelationshipController {

    private final RelationshipService relationshipService;

    public RelationshipController(RelationshipService relationshipService) {
        this.relationshipService = relationshipService;
    }

    @PostMapping
    @Operation(summary = "Create a typed relationship between two entities")
    public ResponseEntity<RelationshipResponse> createRelationship(
            @Valid @RequestBody RelationshipRequest request) {
        RelationshipResponse response = relationshipService.createRelationship(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
