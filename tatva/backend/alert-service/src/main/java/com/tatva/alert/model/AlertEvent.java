package com.tatva.alert.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert_events")
public class AlertEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_id")
    private UUID ruleId;

    @Column(name = "alert_type", nullable = false, length = 30)
    private String alertType;

    @Column(nullable = false, length = 10)
    private String priority;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "entity_ids", columnDefinition = "jsonb", nullable = false)
    private String entityIds;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "acknowledged_by")
    private UUID acknowledgedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "fired_at", nullable = false, updatable = false)
    private Instant firedAt;

    @Column(columnDefinition = "jsonb", nullable = false)
    private String metadata;

    @PrePersist
    protected void onCreate() {
        firedAt = Instant.now();
        if (status == null) status = "NEW";
        if (priority == null) priority = "INFO";
        if (entityIds == null) entityIds = "[]";
        if (metadata == null) metadata = "{}";
    }

    // --- Getters and setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getRuleId() { return ruleId; }
    public void setRuleId(UUID ruleId) { this.ruleId = ruleId; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEntityIds() { return entityIds; }
    public void setEntityIds(String entityIds) { this.entityIds = entityIds; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(UUID acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }

    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public Instant getFiredAt() { return firedAt; }
    public void setFiredAt(Instant firedAt) { this.firedAt = firedAt; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
