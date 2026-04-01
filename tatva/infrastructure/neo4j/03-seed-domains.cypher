// =============================================================================
// TATVA — Neo4j Seed Data
// 6 domain root nodes + color mappings
// =============================================================================

// --- Create 6 Domain Root Nodes ---
MERGE (d:Domain {name: 'Geopolitics'})
  ON CREATE SET
    d.id = randomUUID(),
    d.color = '#3B82F6',
    d.icon = 'globe',
    d.description = 'International relations, diplomacy, treaties, alliances, sanctions',
    d.createdAt = datetime();

MERGE (d:Domain {name: 'Economics'})
  ON CREATE SET
    d.id = randomUUID(),
    d.color = '#22C55E',
    d.icon = 'trending-up',
    d.description = 'Trade, finance, markets, economic policy, sanctions impact',
    d.createdAt = datetime();

MERGE (d:Domain {name: 'Defense'})
  ON CREATE SET
    d.id = randomUUID(),
    d.color = '#EF4444',
    d.icon = 'shield',
    d.description = 'Military operations, defense procurement, arms deals, security',
    d.createdAt = datetime();

MERGE (d:Domain {name: 'Technology'})
  ON CREATE SET
    d.id = randomUUID(),
    d.color = '#A855F7',
    d.icon = 'cpu',
    d.description = 'Cyber operations, AI/ML, semiconductors, space technology, patents',
    d.createdAt = datetime();

MERGE (d:Domain {name: 'Climate'})
  ON CREATE SET
    d.id = randomUUID(),
    d.color = '#F97316',
    d.icon = 'cloud',
    d.description = 'Climate change, energy policy, environmental agreements, disasters',
    d.createdAt = datetime();

MERGE (d:Domain {name: 'Society'})
  ON CREATE SET
    d.id = randomUUID(),
    d.color = '#EAB308',
    d.icon = 'users',
    d.description = 'Demographics, migration, public health, education, cultural affairs',
    d.createdAt = datetime();

// --- Verify ---
MATCH (d:Domain)
RETURN d.name AS domain, d.color AS color, d.description AS description
ORDER BY d.name;
