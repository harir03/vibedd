package com.tatva.audit.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity mapping to the {@code audit_log} table.
 * <p>
 * All columns are marked {@code updatable = false} to reinforce append-only semantics.
 * The PostgreSQL table has BEFORE UPDATE/DELETE triggers that block modifications.
 * </p>
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    @Column(name = "user_id", updatable = false)
    private UUID userId;

    @Column(nullable = false, length = 50, updatable = false)
    private String action;

    @Column(name = "resource_type", nullable = false, length = 50, updatable = false)
    private String resourceType;

    @Column(name = "resource_id", length = 255, updatable = false)
    private String resourceId;

    @Column(name = "old_value", updatable = false, columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", updatable = false, columnDefinition = "text")
    private String newValue;

    @Column(name = "ip_address", updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", updatable = false, columnDefinition = "text")
    private String userAgent;

    @Column(name = "session_id", updatable = false)
    private UUID sessionId;

    @Column(updatable = false, columnDefinition = "text")
    private String justification;

    @Column(updatable = false, columnDefinition = "text")
    private String details;

    // === Getters & Setters ===

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public String getJustification() {
        return justification;
    }

    public void setJustification(String justification) {
        this.justification = justification;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
