package com.tatva.search;

import com.tatva.search.controller.HealthController;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HealthControllerTest {

    private final HealthController controller = new HealthController();

    @Test
    void healthEndpointReturnsCorrectServiceName() {
        ResponseEntity<Map<String, Object>> response = controller.health();
        assertNotNull(response.getBody());
        assertEquals("search-service", response.getBody().get("service"));
        assertEquals("UP", response.getBody().get("status"));
        assertNotNull(response.getBody().get("timestamp"));
    }
}
