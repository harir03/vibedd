// =============================================================================
// TATVA — Neo4j Constraints
// UNIQUE constraints on `id` for all entity node labels
// =============================================================================

// --- Entity Labels ---
CREATE CONSTRAINT actor_id_unique IF NOT EXISTS
  FOR (n:Actor) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT event_id_unique IF NOT EXISTS
  FOR (n:Event) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT location_id_unique IF NOT EXISTS
  FOR (n:Location) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT technology_id_unique IF NOT EXISTS
  FOR (n:Technology) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT resource_id_unique IF NOT EXISTS
  FOR (n:Resource) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT document_id_unique IF NOT EXISTS
  FOR (n:Document) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT metric_id_unique IF NOT EXISTS
  FOR (n:Metric) REQUIRE n.id IS UNIQUE;

// --- System Labels ---
CREATE CONSTRAINT domain_id_unique IF NOT EXISTS
  FOR (n:Domain) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT domain_name_unique IF NOT EXISTS
  FOR (n:Domain) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT source_id_unique IF NOT EXISTS
  FOR (n:Source) REQUIRE n.id IS UNIQUE;
