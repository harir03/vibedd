package com.tatva.graph.controller;

import com.tatva.graph.dto.*;
import com.tatva.graph.service.EntityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for knowledge graph entity CRUD and traversal operations.
 * <p>
 * All read operations accept a clearance level header to filter classified entities.
 * Neighborhood depth is capped at 5.
 * </p>
 */
@RestController
@RequestMapping("/graph")
@Tag(name = "Graph Entities", description = "Knowledge graph entity CRUD, neighborhood, and path queries")
public class EntityController {

    private static final Logger log = LoggerFactory.getLogger(EntityController.class);
    private final EntityService entityService;

    public EntityController(EntityService entityService) {
        this.entityService = entityService;
    }

    @PostMapping("/entities")
    @Operation(summary = "Create entity (single or batch via UNWIND)")
    public ResponseEntity<?> createEntity(@Valid @RequestBody Object body) {
        // Handle single entity
        if (body instanceof EntityRequest request) {
            EntityResponse response = entityService.createEntity(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/entities/single")
    @Operation(summary = "Create a single entity")
    public ResponseEntity<EntityResponse> createSingleEntity(@Valid @RequestBody EntityRequest request) {
        EntityResponse response = entityService.createEntity(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/entities/batch")
    @Operation(summary = "Batch create entities via UNWIND")
    public ResponseEntity<List<EntityResponse>> batchCreateEntities(@RequestBody List<@Valid EntityRequest> requests) {
        List<EntityResponse> responses = entityService.batchCreateEntities(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/entities/{id}")
    @Operation(summary = "Get entity by ID (clearance-filtered)")
    public ResponseEntity<EntityResponse> getEntityById(
            @PathVariable String id,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearance) {
        EntityResponse response = entityService.getEntityById(id, clearance);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/entities/search")
    @Operation(summary = "Search entities by name/alias (full-text, clearance-filtered)")
    public ResponseEntity<List<EntityResponse>> searchEntities(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearance) {
        List<EntityResponse> results = entityService.searchEntities(q, clearance, limit);
        return ResponseEntity.ok(results);
    }

    @PutMapping("/entities/{id}")
    @Operation(summary = "Update entity")
    public ResponseEntity<EntityResponse> updateEntity(
            @PathVariable String id,
            @Valid @RequestBody EntityRequest request) {
        EntityResponse response = entityService.updateEntity(id, request);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/entities/{id}")
    @Operation(summary = "Soft-delete (archive) entity")
    public ResponseEntity<Void> deleteEntity(@PathVariable String id) {
        entityService.archiveEntity(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/entities/{id}/neighborhood")
    @Operation(summary = "N-hop neighborhood query (depth capped at 5)")
    public ResponseEntity<NeighborhoodResponse> getNeighborhood(
            @PathVariable String id,
            @RequestParam(defaultValue = "2") int depth,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearance) {
        NeighborhoodResponse response = entityService.getNeighborhood(id, depth, clearance);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/path")
    @Operation(summary = "Shortest path between two entities")
    public ResponseEntity<PathResponse> getShortestPath(
            @RequestParam String from,
            @RequestParam String to,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearance) {
        PathResponse response = entityService.getShortestPath(from, to, clearance);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/domains/{domain}/entities")
    @Operation(summary = "List entities by domain (clearance-filtered)")
    public ResponseEntity<List<EntityResponse>> getEntitiesByDomain(
            @PathVariable String domain,
            @RequestParam(defaultValue = "50") int limit,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearance) {
        List<EntityResponse> results = entityService.getEntitiesByDomain(domain, clearance, limit);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/entities/{id}/timeline")
    @Operation(summary = "Temporal relationship history for an entity")
    public ResponseEntity<List<RelationshipResponse>> getEntityTimeline(
            @PathVariable String id,
            @RequestHeader(value = "X-Clearance-Level", defaultValue = "0") int clearance) {
        List<RelationshipResponse> results = entityService.getEntityTimeline(id, clearance);
        return ResponseEntity.ok(results);
    }
}
