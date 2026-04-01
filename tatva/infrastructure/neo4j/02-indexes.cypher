// =============================================================================
// TATVA — Neo4j Indexes
// B-tree, full-text, and composite indexes for query performance
// =============================================================================

// --- B-tree indexes on canonicalName (all entity labels) ---
CREATE INDEX actor_canonical_name IF NOT EXISTS
  FOR (n:Actor) ON (n.canonicalName);

CREATE INDEX event_canonical_name IF NOT EXISTS
  FOR (n:Event) ON (n.canonicalName);

CREATE INDEX location_canonical_name IF NOT EXISTS
  FOR (n:Location) ON (n.canonicalName);

CREATE INDEX technology_canonical_name IF NOT EXISTS
  FOR (n:Technology) ON (n.canonicalName);

CREATE INDEX resource_canonical_name IF NOT EXISTS
  FOR (n:Resource) ON (n.canonicalName);

CREATE INDEX document_canonical_name IF NOT EXISTS
  FOR (n:Document) ON (n.canonicalName);

CREATE INDEX metric_canonical_name IF NOT EXISTS
  FOR (n:Metric) ON (n.canonicalName);

// --- Composite indexes on domain + type ---
CREATE INDEX actor_domain_type IF NOT EXISTS
  FOR (n:Actor) ON (n.domain, n.type);

CREATE INDEX event_domain_type IF NOT EXISTS
  FOR (n:Event) ON (n.domain, n.type);

CREATE INDEX location_domain IF NOT EXISTS
  FOR (n:Location) ON (n.domain);

// --- B-tree indexes on entity type field ---
CREATE INDEX actor_type IF NOT EXISTS
  FOR (n:Actor) ON (n.type);

CREATE INDEX event_type IF NOT EXISTS
  FOR (n:Event) ON (n.type);

// --- Temporal indexes for relationship time-range queries ---
// Note: Relationship property indexes require Neo4j Enterprise or APOC.
// For Community Edition, temporal filtering is done in WHERE clauses.

// --- B-tree indexes on credibilityScore ---
CREATE INDEX actor_credibility IF NOT EXISTS
  FOR (n:Actor) ON (n.credibilityScore);

CREATE INDEX event_credibility IF NOT EXISTS
  FOR (n:Event) ON (n.credibilityScore);

// --- Full-text indexes for search ---
CREATE FULLTEXT INDEX entity_fulltext IF NOT EXISTS
  FOR (n:Actor|Event|Location|Technology|Resource|Document|Metric)
  ON EACH [n.canonicalName, n.aliases, n.description];

CREATE FULLTEXT INDEX document_content_fulltext IF NOT EXISTS
  FOR (n:Document)
  ON EACH [n.title, n.content, n.summary];

// --- Domain node index ---
CREATE INDEX domain_name IF NOT EXISTS
  FOR (n:Domain) ON (n.name);

// --- Source node index ---
CREATE INDEX source_name IF NOT EXISTS
  FOR (n:Source) ON (n.name);

CREATE INDEX source_tier IF NOT EXISTS
  FOR (n:Source) ON (n.tier);
