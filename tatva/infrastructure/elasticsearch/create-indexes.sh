#!/bin/bash
# =============================================================================
# TATVA — Elasticsearch Index Initialization
# Creates all indexes with proper mappings
# =============================================================================

ES_HOST="${1:-http://localhost:9200}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAPPINGS_DIR="$SCRIPT_DIR/mappings"

echo "═══════════════════════════════════════════════════════"
echo "  TATVA — Creating Elasticsearch Indexes"
echo "  Host: $ES_HOST"
echo "═══════════════════════════════════════════════════════"

INDEXES=("tatva-actors" "tatva-events" "tatva-locations" "tatva-documents")

for INDEX in "${INDEXES[@]}"; do
  MAPPING_FILE="$MAPPINGS_DIR/${INDEX}.json"
  if [ -f "$MAPPING_FILE" ]; then
    echo "Creating index: $INDEX"
    curl -s -X PUT "$ES_HOST/$INDEX" \
      -H "Content-Type: application/json" \
      -d @"$MAPPING_FILE" | python3 -m json.tool 2>/dev/null || echo "  (created or already exists)"
    echo ""
  else
    echo "WARNING: Mapping file not found: $MAPPING_FILE"
  fi
done

echo "═══════════════════════════════════════════════════════"
echo "  Current indexes:"
curl -s "$ES_HOST/_cat/indices?v" 2>/dev/null | grep tatva
echo ""
echo "  TATVA — Elasticsearch Indexes Ready!"
echo "═══════════════════════════════════════════════════════"
