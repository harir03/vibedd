package com.tatva.gateway;

import com.tatva.gateway.controller.HealthController;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {

    private final HealthController controller = new HealthController();

    @Test
    void healthEndpointReturnsUpStatus() {
        Map<String, Object> health = controller.health();

        assertThat(health)
                .containsEntry("service", "api-gateway")
                .containsEntry("status", "UP")
                .containsKey("timestamp");
    }
}
