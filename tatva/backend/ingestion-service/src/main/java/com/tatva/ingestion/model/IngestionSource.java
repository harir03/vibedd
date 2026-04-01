package com.tatva.ingestion.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a data ingestion source (RSS feed, API, etc.).
 * Maps to the ingestion_sources table.
 */
@Entity
@Table(name = "ingestion_sources")
public class IngestionSource {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Column(columnDefinition = "TEXT")
    private String url;

    @Column(name = "reliability_tier")
    private int reliabilityTier;

    @Column(length = 50)
    private String domain;

    @Column(name = "schedule_cron", length = 100)
    private String scheduleCron;

    @Column(name = "last_successful_run")
    private Instant lastSuccessfulRun;

    @Column(name = "is_active")
    private boolean active = true;

    // ── Getters & Setters ─────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public int getReliabilityTier() { return reliabilityTier; }
    public void setReliabilityTier(int reliabilityTier) { this.reliabilityTier = reliabilityTier; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getScheduleCron() { return scheduleCron; }
    public void setScheduleCron(String scheduleCron) { this.scheduleCron = scheduleCron; }

    public Instant getLastSuccessfulRun() { return lastSuccessfulRun; }
    public void setLastSuccessfulRun(Instant lastSuccessfulRun) { this.lastSuccessfulRun = lastSuccessfulRun; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
