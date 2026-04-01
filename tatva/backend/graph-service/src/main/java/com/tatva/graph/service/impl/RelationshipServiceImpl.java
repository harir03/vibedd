package com.tatva.graph.service.impl;

import com.tatva.graph.dto.RelationshipRequest;
import com.tatva.graph.dto.RelationshipResponse;
import com.tatva.graph.service.RelationshipService;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Neo4j-backed implementation for relationship operations.
 * Relationship types are validated against a whitelist before interpolation.
 * All property values are parameterized.
 */
@Service
public class RelationshipServiceImpl implements RelationshipService {

    private static final Logger log = LoggerFactory.getLogger(RelationshipServiceImpl.class);

    private static final Set<String> VALID_REL_TYPES = Set.of(
            "ALLIES_WITH", "RIVALS_WITH", "SANCTIONS", "TRADES_WITH", "INVESTS_IN",
            "DEPLOYS_IN", "OPERATES_IN", "LEADS", "MEMBER_OF", "PARTICIPATES_IN",
            "OCCURRED_IN", "LOCATED_IN", "BORDERS", "PRODUCES", "CONSUMES",
            "DEVELOPS", "MANUFACTURES", "EXPORTS_TO", "IMPORTS_FROM", "SIGNED",
            "VIOLATED", "NEGOTIATES", "MEDIATES", "SUPPORTS", "OPPOSES",
            "FUNDS", "SUPPLIES", "TARGETS", "MONITORS", "COLLABORATES_WITH",
            "COMPETES_WITH", "SUCCEEDED_BY", "PRECEDED_BY", "CAUSED_BY",
            "RESULTED_IN", "FOLLOWED_BY", "RELATED_TO", "HAS_SUBSIDIARY",
            "PART_OF", "EMPLOYS", "TRAINS_WITH", "UNKNOWN_RELATION"
    );

    private final Driver driver;

    public RelationshipServiceImpl(Driver driver) {
        this.driver = driver;
    }

    @Override
    public RelationshipResponse createRelationship(RelationshipRequest request) {
        String relType = validateRelType(request.type());

        Map<String, Object> params = new HashMap<>();
        params.put("sourceId", request.sourceId());
        params.put("targetId", request.targetId());
        params.put("validFrom", request.validFrom());
        params.put("validTo", request.validTo());
        params.put("strength", request.strength() != null ? request.strength() : 0.5);
        params.put("description", request.description() != null ? request.description() : "");
        params.put("domain", request.domain() != null ? request.domain() : "");
        params.put("credibilityScore", request.credibilityScore() != null ? request.credibilityScore() : 0.5);

        // Relationship type is from validated whitelist — safe to interpolate
        String cypher = String.format("""
                MATCH (a {id: $sourceId}), (b {id: $targetId})
                CREATE (a)-[r:%s {
                    validFrom: $validFrom, validTo: $validTo,
                    strength: $strength, description: $description,
                    domain: $domain, credibilityScore: $credibilityScore,
                    createdAt: datetime()
                }]->(b)
                RETURN a.id AS sourceId, b.id AS targetId, type(r) AS relType, r
                """, relType);

        try (Session session = driver.session()) {
            Result result = session.run(cypher, params);
            if (result.hasNext()) {
                Record record = result.next();
                log.info("Relationship created: {} -[{}]-> {}",
                        request.sourceId(), relType, request.targetId());

                var rel = record.get("r").asRelationship();
                return new RelationshipResponse(
                        record.get("sourceId").asString(),
                        record.get("targetId").asString(),
                        record.get("relType").asString(),
                        getStringOrNull(rel, "validFrom"),
                        getStringOrNull(rel, "validTo"),
                        rel.containsKey("strength") ? rel.get("strength").asDouble() : null,
                        getStringOrNull(rel, "description"),
                        getStringOrNull(rel, "domain"),
                        rel.containsKey("credibilityScore") ? rel.get("credibilityScore").asDouble() : null,
                        Map.of()
                );
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Failed to create relationship. Verify source and target entities exist.");
    }

    private String validateRelType(String type) {
        if (type == null || type.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Relationship type is required");
        }
        String normalized = type.toUpperCase().replace(" ", "_");
        if (!VALID_REL_TYPES.contains(normalized)) {
            // Allow unknown relation types but log a warning
            log.warn("Non-standard relationship type used: {}. Storing as UNKNOWN_RELATION.", type);
            return "UNKNOWN_RELATION";
        }
        return normalized;
    }

    private String getStringOrNull(org.neo4j.driver.types.MapAccessor entity, String key) {
        if (entity.containsKey(key) && !entity.get(key).isNull()) {
            return entity.get(key).asString();
        }
        return null;
    }
}
