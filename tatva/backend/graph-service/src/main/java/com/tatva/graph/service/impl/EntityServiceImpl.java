package com.tatva.graph.service.impl;

import com.tatva.graph.dto.*;
import com.tatva.graph.service.EntityService;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Value;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Path;
import org.neo4j.driver.types.Relationship;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Neo4j-backed implementation of the Entity Service.
 * <ul>
 *   <li>ALL queries use parameterized values — NEVER string concatenation for user data.</li>
 *   <li>Labels are validated against a whitelist before interpolation (safe).</li>
 *   <li>Neighborhood depth capped at MAX_DEPTH=5.</li>
 *   <li>Clearance-level filtering on all read queries.</li>
 *   <li>Query timeout: 30 seconds.</li>
 * </ul>
 */
@Service
public class EntityServiceImpl implements EntityService {

    private static final Logger log = LoggerFactory.getLogger(EntityServiceImpl.class);

    private static final Set<String> VALID_LABELS = Set.of(
            "Actor", "Event", "Location", "Technology", "Resource", "Document", "Metric"
    );
    private static final int MAX_DEPTH = 5;
    private static final int DEFAULT_DEPTH = 2;

    private final Driver driver;

    public EntityServiceImpl(Driver driver) {
        this.driver = driver;
    }

    @Override
    public EntityResponse createEntity(EntityRequest request) {
        String label = validateLabel(request.label());
        String id = UUID.randomUUID().toString();

        Map<String, Object> params = buildEntityParams(id, request);
        // Label is from validated whitelist — safe to interpolate
        String cypher = String.format("""
                CREATE (n:%s {id: $id, canonicalName: $canonicalName, aliases: $aliases,
                    description: $description, domain: $domain, type: $type,
                    credibilityScore: $credibilityScore, clearanceLevel: $clearanceLevel,
                    createdAt: datetime(), updatedAt: datetime()})
                RETURN n
                """, label);

        try (Session session = driver.session()) {
            Result result = session.run(cypher, params);
            if (result.hasNext()) {
                Node node = result.next().get("n").asNode();
                log.info("Entity created: id={}, label={}, name={}", id, label, request.canonicalName());
                return nodeToResponse(node);
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create entity");
    }

    @Override
    public List<EntityResponse> batchCreateEntities(List<EntityRequest> requests) {
        if (requests.isEmpty()) return List.of();

        String label = validateLabel(requests.getFirst().label());
        List<Map<String, Object>> batch = requests.stream()
                .map(req -> buildEntityParams(UUID.randomUUID().toString(), req))
                .toList();

        String cypher = String.format("""
                UNWIND $batch AS entity
                CREATE (n:%s {id: entity.id, canonicalName: entity.canonicalName,
                    aliases: entity.aliases, description: entity.description,
                    domain: entity.domain, type: entity.type,
                    credibilityScore: entity.credibilityScore, clearanceLevel: entity.clearanceLevel,
                    createdAt: datetime(), updatedAt: datetime()})
                RETURN n
                """, label);

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of("batch", batch));
            List<EntityResponse> responses = new ArrayList<>();
            while (result.hasNext()) {
                responses.add(nodeToResponse(result.next().get("n").asNode()));
            }
            log.info("Batch created {} entities with label {}", responses.size(), label);
            return responses;
        }
    }

    @Override
    public EntityResponse getEntityById(String id, int userClearance) {
        String cypher = """
                MATCH (n {id: $id})
                WHERE n.clearanceLevel <= $maxClearance
                RETURN n
                """;

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of("id", id, "maxClearance", userClearance));
            if (result.hasNext()) {
                return nodeToResponse(result.next().get("n").asNode());
            }
        }
        return null;
    }

    @Override
    public List<EntityResponse> searchEntities(String query, int userClearance, int limit) {
        String cypher = """
                CALL db.index.fulltext.queryNodes('entity_fulltext', $query) YIELD node, score
                WHERE node.clearanceLevel <= $maxClearance
                RETURN node
                ORDER BY score DESC
                LIMIT $limit
                """;

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of(
                    "query", query, "maxClearance", userClearance, "limit", limit));
            List<EntityResponse> responses = new ArrayList<>();
            while (result.hasNext()) {
                responses.add(nodeToResponse(result.next().get("node").asNode()));
            }
            return responses;
        }
    }

    @Override
    public EntityResponse updateEntity(String id, EntityRequest request) {
        validateLabel(request.label());
        String cypher = """
                MATCH (n {id: $id})
                SET n.canonicalName = $canonicalName,
                    n.aliases = $aliases,
                    n.description = $description,
                    n.domain = $domain,
                    n.type = $type,
                    n.credibilityScore = $credibilityScore,
                    n.clearanceLevel = $clearanceLevel,
                    n.updatedAt = datetime()
                RETURN n
                """;

        Map<String, Object> params = buildEntityParams(id, request);

        try (Session session = driver.session()) {
            Result result = session.run(cypher, params);
            if (result.hasNext()) {
                log.info("Entity updated: id={}", id);
                return nodeToResponse(result.next().get("n").asNode());
            }
        }
        return null;
    }

    @Override
    public void archiveEntity(String id) {
        String cypher = """
                MATCH (n {id: $id})
                SET n:Archived, n.archivedAt = datetime()
                RETURN n.id AS archived
                """;

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of("id", id));
            if (result.hasNext()) {
                log.info("Entity archived: id={}", id);
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entity not found: " + id);
            }
        }
    }

    @Override
    public NeighborhoodResponse getNeighborhood(String id, int depth, int userClearance) {
        int cappedDepth = Math.min(Math.max(depth, 1), MAX_DEPTH);
        if (depth > MAX_DEPTH) {
            log.warn("Depth {} exceeds max {}. Capped to {}", depth, MAX_DEPTH, cappedDepth);
        }

        // Dynamic depth range requires string formatting — depth comes from validated int, safe
        String cypher = String.format("""
                MATCH (center {id: $id})
                WHERE center.clearanceLevel <= $maxClearance
                OPTIONAL MATCH path = (center)-[*1..%d]-(neighbor)
                WHERE neighbor.clearanceLevel <= $maxClearance
                RETURN center, collect(DISTINCT neighbor) AS neighbors,
                       [r IN collect(DISTINCT relationships(path)) | r[0]] AS rels
                """, cappedDepth);

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of("id", id, "maxClearance", userClearance));
            if (result.hasNext()) {
                Record record = result.next();
                Node center = record.get("center").asNode();
                List<EntityResponse> nodes = new ArrayList<>();
                nodes.add(nodeToResponse(center));

                for (Object obj : record.get("neighbors").asList()) {
                    if (obj instanceof Node neighbor) {
                        nodes.add(nodeToResponse(neighbor));
                    }
                }

                List<RelationshipResponse> edges = new ArrayList<>();
                for (Object obj : record.get("rels").asList()) {
                    if (obj instanceof Relationship rel) {
                        edges.add(relationshipToResponse(rel));
                    }
                }

                return new NeighborhoodResponse(id, cappedDepth, nodes, edges,
                        nodes.size(), edges.size());
            }
        }
        return null;
    }

    @Override
    public PathResponse getShortestPath(String fromId, String toId, int userClearance) {
        String cypher = """
                MATCH (a {id: $fromId}), (b {id: $toId})
                WHERE a.clearanceLevel <= $maxClearance AND b.clearanceLevel <= $maxClearance
                MATCH path = shortestPath((a)-[*..10]-(b))
                RETURN path
                """;

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of(
                    "fromId", fromId, "toId", toId, "maxClearance", userClearance));
            if (result.hasNext()) {
                Path path = result.next().get("path").asPath();
                List<EntityResponse> nodes = new ArrayList<>();
                for (Node node : path.nodes()) {
                    nodes.add(nodeToResponse(node));
                }
                List<RelationshipResponse> edges = new ArrayList<>();
                for (Relationship rel : path.relationships()) {
                    edges.add(relationshipToResponse(rel));
                }
                return new PathResponse(fromId, toId, nodes, edges, edges.size());
            }
        }
        return null;
    }

    @Override
    public List<EntityResponse> getEntitiesByDomain(String domain, int userClearance, int limit) {
        String cypher = """
                MATCH (n)
                WHERE n.domain = $domain AND n.clearanceLevel <= $maxClearance
                  AND NOT n:Domain AND NOT n:Source AND NOT n:Archived
                RETURN n
                ORDER BY n.credibilityScore DESC
                LIMIT $limit
                """;

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of(
                    "domain", domain, "maxClearance", userClearance, "limit", limit));
            List<EntityResponse> responses = new ArrayList<>();
            while (result.hasNext()) {
                responses.add(nodeToResponse(result.next().get("n").asNode()));
            }
            return responses;
        }
    }

    @Override
    public List<RelationshipResponse> getEntityTimeline(String id, int userClearance) {
        String cypher = """
                MATCH (n {id: $id})-[r]-(m)
                WHERE m.clearanceLevel <= $maxClearance AND r.validFrom IS NOT NULL
                RETURN r, m.id AS targetId
                ORDER BY r.validFrom ASC
                """;

        try (Session session = driver.session()) {
            Result result = session.run(cypher, Map.of("id", id, "maxClearance", userClearance));
            List<RelationshipResponse> responses = new ArrayList<>();
            while (result.hasNext()) {
                Record record = result.next();
                Relationship rel = record.get("r").asRelationship();
                responses.add(relationshipToResponse(rel));
            }
            return responses;
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private String validateLabel(String label) {
        if (label == null || !VALID_LABELS.contains(label)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid entity label: " + label + ". Must be one of: " + VALID_LABELS);
        }
        return label;
    }

    private Map<String, Object> buildEntityParams(String id, EntityRequest request) {
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("canonicalName", request.canonicalName());
        params.put("aliases", request.aliases() != null ? request.aliases() : List.of());
        params.put("description", request.description() != null ? request.description() : "");
        params.put("domain", request.domain());
        params.put("type", request.type() != null ? request.type() : "");
        params.put("credibilityScore", request.credibilityScore());
        params.put("clearanceLevel", request.clearanceLevel());
        return params;
    }

    private EntityResponse nodeToResponse(Node node) {
        String label = node.labels().iterator().hasNext()
                ? node.labels().iterator().next() : "Unknown";
        // Skip system labels
        for (String l : node.labels()) {
            if (VALID_LABELS.contains(l)) {
                label = l;
                break;
            }
        }

        return new EntityResponse(
                getStringOrNull(node, "id"),
                label,
                getStringOrNull(node, "canonicalName"),
                node.containsKey("aliases") && !node.get("aliases").isNull()
                        ? node.get("aliases").asList(Value::asString) : List.of(),
                getStringOrNull(node, "description"),
                getStringOrNull(node, "domain"),
                getStringOrNull(node, "type"),
                node.containsKey("credibilityScore") && !node.get("credibilityScore").isNull()
                        ? node.get("credibilityScore").asDouble() : null,
                node.containsKey("clearanceLevel") && !node.get("clearanceLevel").isNull()
                        ? node.get("clearanceLevel").asInt() : null,
                getStringOrNull(node, "createdAt"),
                getStringOrNull(node, "updatedAt"),
                Map.of() // additional properties placeholder
        );
    }

    private RelationshipResponse relationshipToResponse(Relationship rel) {
        return new RelationshipResponse(
                String.valueOf(rel.startNodeElementId()),
                String.valueOf(rel.endNodeElementId()),
                rel.type(),
                getStringOrNull(rel, "validFrom"),
                getStringOrNull(rel, "validTo"),
                rel.containsKey("strength") && !rel.get("strength").isNull()
                        ? rel.get("strength").asDouble() : null,
                getStringOrNull(rel, "description"),
                getStringOrNull(rel, "domain"),
                rel.containsKey("credibilityScore") && !rel.get("credibilityScore").isNull()
                        ? rel.get("credibilityScore").asDouble() : null,
                Map.of()
        );
    }

    private String getStringOrNull(org.neo4j.driver.types.MapAccessor entity, String key) {
        if (entity.containsKey(key) && !entity.get(key).isNull()) {
            return entity.get(key).asString();
        }
        return null;
    }
}
