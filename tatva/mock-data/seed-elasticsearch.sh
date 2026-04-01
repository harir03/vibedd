#!/bin/bash
# ================================================================
# TATVA — Elasticsearch Mock Data Seed Script
# Loads actors, events, and locations from JSON fixtures into ES
# using the Bulk API.
#
# Usage:
#   chmod +x mock-data/seed-elasticsearch.sh
#   ./mock-data/seed-elasticsearch.sh
#
# Prerequisites:
#   - Elasticsearch running at localhost:9200 (tatva-elasticsearch)
#   - Indexes created via infrastructure/elasticsearch/create-indexes.sh
#   - jq installed (brew install jq / apt-get install jq)
# ================================================================

set -euo pipefail

ES_HOST="${ES_HOST:-http://localhost:9200}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURES_DIR="${SCRIPT_DIR}/fixtures"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  TATVA — Elasticsearch Mock Data Seeder${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ── Check prerequisites ──────────────────────────────────────────
check_prerequisites() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ jq is not installed. Install with: brew install jq${NC}"
    exit 1
  fi

  if ! curl -s --fail "${ES_HOST}/_cluster/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Elasticsearch not reachable at ${ES_HOST}${NC}"
    echo "  Start with: docker compose up -d tatva-elasticsearch"
    exit 1
  fi

  echo -e "${GREEN}✓ Prerequisites OK (jq installed, ES reachable)${NC}"
}

# ── Index actors ─────────────────────────────────────────────────
index_actors() {
  local file="${FIXTURES_DIR}/entities/actors.json"
  local index="tatva-actors"
  local count=0

  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ ${file} not found${NC}"
    return 1
  fi

  echo -e "${YELLOW}▸ Indexing actors into ${index}...${NC}"

  # Build bulk request body from JSON array using jq
  local bulk_body=""
  bulk_body=$(jq -r -c '.[] | 
    { index: { _index: "'"${index}"'", _id: .id } },
    {
      id: .id,
      canonicalName: .canonicalName,
      aliases: (.aliases // []),
      type: .type,
      domain: .domain,
      description: .description,
      credibilityScore: (.credibilityScore // 0.5),
      sourceCount: ((.aliases // []) | length),
      clearanceLevel: 0,
      metadata: {
        subtype: (.subtype // null),
        nationality: (.nationality // null),
        wikidataQid: (.wikidataQid // null)
      },
      createdAt: "'"${NOW}"'",
      updatedAt: "'"${NOW}"'"
    }
  ' "$file" | sed 's/$//')

  count=$(jq '. | length' "$file")

  # Send bulk request
  local response
  response=$(echo "$bulk_body" | curl -s -X POST "${ES_HOST}/_bulk" \
    -H "Content-Type: application/x-ndjson" \
    --data-binary @-)

  local errors
  errors=$(echo "$response" | jq '.errors')

  if [ "$errors" = "false" ]; then
    echo -e "${GREEN}  ✓ Indexed ${count} actors${NC}"
  else
    local error_count
    error_count=$(echo "$response" | jq '[.items[] | select(.index.error)] | length')
    echo -e "${RED}  ✗ ${error_count}/${count} actors failed to index${NC}"
    echo "$response" | jq '.items[] | select(.index.error) | .index.error' | head -5
  fi
}

# ── Index events ─────────────────────────────────────────────────
index_events() {
  local file="${FIXTURES_DIR}/entities/events.json"
  local index="tatva-events"
  local count=0

  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ ${file} not found${NC}"
    return 1
  fi

  echo -e "${YELLOW}▸ Indexing events into ${index}...${NC}"

  local bulk_body=""
  bulk_body=$(jq -r -c '.[] | 
    { index: { _index: "'"${index}"'", _id: .id } },
    {
      id: .id,
      canonicalName: .canonicalName,
      aliases: (.aliases // []),
      type: "EVENT",
      domain: .domain,
      description: .description,
      date: (.date // null),
      validFrom: (.date // null),
      validTo: null,
      participants: [],
      credibilityScore: (.credibilityScore // 0.5),
      sourceCount: 1,
      clearanceLevel: 0,
      metadata: {
        subtype: (.subtype // null)
      },
      createdAt: "'"${NOW}"'",
      updatedAt: "'"${NOW}"'"
    }
  ' "$file" | sed 's/$//')

  count=$(jq '. | length' "$file")

  local response
  response=$(echo "$bulk_body" | curl -s -X POST "${ES_HOST}/_bulk" \
    -H "Content-Type: application/x-ndjson" \
    --data-binary @-)

  local errors
  errors=$(echo "$response" | jq '.errors')

  if [ "$errors" = "false" ]; then
    echo -e "${GREEN}  ✓ Indexed ${count} events${NC}"
  else
    local error_count
    error_count=$(echo "$response" | jq '[.items[] | select(.index.error)] | length')
    echo -e "${RED}  ✗ ${error_count}/${count} events failed to index${NC}"
    echo "$response" | jq '.items[] | select(.index.error) | .index.error' | head -5
  fi
}

# ── Index locations ──────────────────────────────────────────────
index_locations() {
  local file="${FIXTURES_DIR}/entities/locations.json"
  local index="tatva-locations"
  local count=0

  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ ${file} not found${NC}"
    return 1
  fi

  echo -e "${YELLOW}▸ Indexing locations into ${index}...${NC}"

  local bulk_body=""
  bulk_body=$(jq -r -c '.[] |
    { index: { _index: "'"${index}"'", _id: .id } },
    {
      id: .id,
      canonicalName: .canonicalName,
      aliases: (.aliases // []),
      type: "LOCATION",
      domain: .domain,
      description: .description,
      coordinates: (if .coordinates then { lat: .coordinates.lat, lon: .coordinates.lng } else null end),
      region: (.subtype // null),
      country: null,
      locationType: (.subtype // null),
      credibilityScore: (.credibilityScore // 0.5),
      clearanceLevel: 0,
      metadata: {
        subtype: (.subtype // null)
      },
      createdAt: "'"${NOW}"'",
      updatedAt: "'"${NOW}"'"
    }
  ' "$file" | sed 's/$//')

  count=$(jq '. | length' "$file")

  local response
  response=$(echo "$bulk_body" | curl -s -X POST "${ES_HOST}/_bulk" \
    -H "Content-Type: application/x-ndjson" \
    --data-binary @-)

  local errors
  errors=$(echo "$response" | jq '.errors')

  if [ "$errors" = "false" ]; then
    echo -e "${GREEN}  ✓ Indexed ${count} locations${NC}"
  else
    local error_count
    error_count=$(echo "$response" | jq '[.items[] | select(.index.error)] | length')
    echo -e "${RED}  ✗ ${error_count}/${count} locations failed to index${NC}"
    echo "$response" | jq '.items[] | select(.index.error) | .index.error' | head -5
  fi
}

# ── Verify counts ────────────────────────────────────────────────
verify_counts() {
  echo ""
  echo -e "${YELLOW}▸ Refreshing indexes...${NC}"
  curl -s -X POST "${ES_HOST}/tatva-actors,tatva-events,tatva-locations/_refresh" > /dev/null

  echo -e "${YELLOW}▸ Verifying document counts...${NC}"
  echo ""

  local actors events locations total

  actors=$(curl -s "${ES_HOST}/tatva-actors/_count" | jq '.count')
  events=$(curl -s "${ES_HOST}/tatva-events/_count" | jq '.count')
  locations=$(curl -s "${ES_HOST}/tatva-locations/_count" | jq '.count')
  total=$((actors + events + locations))

  printf "  %-20s %s\n" "tatva-actors:" "${actors} documents"
  printf "  %-20s %s\n" "tatva-events:" "${events} documents"
  printf "  %-20s %s\n" "tatva-locations:" "${locations} documents"
  echo "  ────────────────────────────────"
  printf "  %-20s %s\n" "Total:" "${total} documents"
  echo ""

  if [ "$total" -ge 100 ]; then
    echo -e "${GREEN}✓ SUCCESS: ${total} documents indexed (≥100 threshold met)${NC}"
  else
    echo -e "${RED}✗ WARN: Only ${total} documents indexed (expected ≥100)${NC}"
  fi
}

# ── Sample search test ───────────────────────────────────────────
test_search() {
  echo ""
  echo -e "${YELLOW}▸ Running sample searches...${NC}"

  # Test 1: Search for "India" across actors
  local result
  result=$(curl -s "${ES_HOST}/tatva-actors/_search" -H "Content-Type: application/json" -d '{
    "query": { "match": { "canonicalName": "India" } },
    "size": 3,
    "_source": ["canonicalName", "type"]
  }')
  local hits
  hits=$(echo "$result" | jq '.hits.total.value')
  echo -e "  Search 'India' in actors  → ${hits} hits"

  # Test 2: Search for "Galwan" across events
  result=$(curl -s "${ES_HOST}/tatva-events/_search" -H "Content-Type: application/json" -d '{
    "query": { "match": { "canonicalName": "Galwan" } },
    "size": 3,
    "_source": ["canonicalName", "date"]
  }')
  hits=$(echo "$result" | jq '.hits.total.value')
  echo -e "  Search 'Galwan' in events → ${hits} hits"

  # Test 3: Search for "South China Sea" in locations
  result=$(curl -s "${ES_HOST}/tatva-locations/_search" -H "Content-Type: application/json" -d '{
    "query": { "match": { "canonicalName": "South China Sea" } },
    "size": 3,
    "_source": ["canonicalName", "locationType"]
  }')
  hits=$(echo "$result" | jq '.hits.total.value')
  echo -e "  Search 'South China Sea' in locations → ${hits} hits"

  echo ""
}

# ── Main ─────────────────────────────────────────────────────────
main() {
  check_prerequisites
  echo ""
  index_actors
  index_events
  index_locations
  verify_counts
  test_search

  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  TATVA Elasticsearch seed complete!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

main "$@"
