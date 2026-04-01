package com.tatva.alert.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tatva.alert.model.AlertEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time alert notifications.
 * Maintains connected sessions and broadcasts alert events to all clients.
 */
@Component
public class AlertWebSocketHandler extends TextWebSocketHandler implements AlertBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(AlertWebSocketHandler.class);

    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final ObjectMapper objectMapper;

    public AlertWebSocketHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("WebSocket connected: sessionId={}, total={}", session.getId(), sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("WebSocket disconnected: sessionId={}, reason={}, total={}",
                session.getId(), status.getReason(), sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Clients can send ping/pong or subscribe to specific alert types
        log.debug("WebSocket message received: sessionId={}, payload={}",
                session.getId(), message.getPayload());
    }

    /**
     * Broadcasts an alert event to all connected WebSocket clients.
     * Failed sends are logged but don't interrupt other broadcasts.
     */
    public void broadcast(AlertEvent event) {
        if (sessions.isEmpty()) {
            log.debug("No WebSocket clients connected, skipping broadcast");
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(event);
            TextMessage message = new TextMessage(json);

            int sent = 0;
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                        sent++;
                    } catch (IOException e) {
                        log.warn("Failed to send WebSocket message to session {}: {}",
                                session.getId(), e.getMessage());
                        sessions.remove(session);
                    }
                } else {
                    sessions.remove(session);
                }
            }
            log.debug("Alert broadcast to {}/{} clients: type={}, title={}",
                    sent, sessions.size(), event.getAlertType(), event.getTitle());
        } catch (Exception e) {
            log.error("Failed to serialize alert event for WebSocket broadcast", e);
        }
    }

    /** Returns the count of currently connected WebSocket sessions. */
    public int getActiveSessionCount() {
        return sessions.size();
    }
}
