#!/bin/bash
# =============================================================================
# TATVA — Kafka Topic Creation Script
# Run this if topics need to be recreated outside of Docker Compose
# =============================================================================

BOOTSTRAP_SERVER="${1:-localhost:9092}"

echo "═══════════════════════════════════════════════════════"
echo "  TATVA — Creating Kafka Topics"
echo "  Bootstrap Server: $BOOTSTRAP_SERVER"
echo "═══════════════════════════════════════════════════════"

# Core topics
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic raw.news.articles          --partitions 6  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic nlp.entities.extracted      --partitions 6  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic nlp.relations.extracted     --partitions 6  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic graph.updates               --partitions 6  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic analytics.events            --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic alerts.triggers             --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic system.health               --partitions 1  --replication-factor 1

# Dead Letter Queues
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic raw.news.articles.dlq      --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic nlp.entities.extracted.dlq  --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic nlp.relations.extracted.dlq --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic graph.updates.dlq           --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic analytics.events.dlq        --partitions 3  --replication-factor 1
kafka-topics --create --if-not-exists --bootstrap-server "$BOOTSTRAP_SERVER" --topic alerts.triggers.dlq         --partitions 3  --replication-factor 1

echo ""
echo "Topics created:"
kafka-topics --list --bootstrap-server "$BOOTSTRAP_SERVER"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  TATVA — Kafka Topics Ready!"
echo "═══════════════════════════════════════════════════════"
