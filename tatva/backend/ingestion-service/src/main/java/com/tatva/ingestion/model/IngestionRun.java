package com.tatva.ingestion.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a single ingestion pipeline run.
 * Maps to the ingestion_runs table.
 */
@Entity
@Table(name = "ingestion_runs")
public class IngestionRun {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private IngestionSource source;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(length = 20)
    private String status;

    @Column(name = "documents_fetched")
    private int documentsFetched;

    @Column(name = "entities_extracted")
    private int entitiesExtracted;

    @Column(name = "relations_extracted")
    private int relationsExtracted;

    @Column(columnDefinition = "JSONB")
    private String errors;

    // ── Getters & Setters ─────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public IngestionSource getSource() { return source; }
    public void setSource(IngestionSource source) { this.source = source; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getDocumentsFetched() { return documentsFetched; }
    public void setDocumentsFetched(int documentsFetched) { this.documentsFetched = documentsFetched; }

    public int getEntitiesExtracted() { return entitiesExtracted; }
    public void setEntitiesExtracted(int entitiesExtracted) { this.entitiesExtracted = entitiesExtracted; }

    public int getRelationsExtracted() { return relationsExtracted; }
    public void setRelationsExtracted(int relationsExtracted) { this.relationsExtracted = relationsExtracted; }

    public String getErrors() { return errors; }
    public void setErrors(String errors) { this.errors = errors; }
}
