package com.tatva.alert.websocket;

import com.tatva.alert.model.AlertEvent;

/**
 * Interface for broadcasting alert events to connected clients.
 */
public interface AlertBroadcaster {

    /** Broadcast an alert event to all connected clients. */
    void broadcast(AlertEvent event);

    /** Returns the count of currently connected sessions. */
    int getActiveSessionCount();
}
