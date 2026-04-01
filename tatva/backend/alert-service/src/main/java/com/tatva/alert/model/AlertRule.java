package com.tatva.alert.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert_rules")
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "alert_type", nullable = false, length = 30)
    private String alertType;

    @Column(columnDefinition = "jsonb", nullable = false)
    private String conditions;

    @Column(columnDefinition = "jsonb", nullable = false)
    private String channels;

    @Column(nullable = false, length = 10)
    private String priority;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (priority == null) priority = "INFO";
        if (channels == null) channels = "[\"DASHBOARD\"]";
        if (conditions == null) conditions = "{}";
        active = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // --- Getters and setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getConditions() { return conditions; }
    public void setConditions(String conditions) { this.conditions = conditions; }

    public String getChannels() { return channels; }
    public void setChannels(String channels) { this.channels = channels; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
