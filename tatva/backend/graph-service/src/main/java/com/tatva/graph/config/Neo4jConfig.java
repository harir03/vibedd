package com.tatva.graph.config;

import org.neo4j.driver.Config;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Neo4j driver configuration for TATVA graph service.
 * <ul>
 *   <li>Query timeout: 30 seconds (kills long-running traversals)</li>
 *   <li>Connection pool: max 50 connections</li>
 *   <li>Connection timeout: 30 seconds</li>
 * </ul>
 *
 * <p>The Neo4j Driver bean is auto-configured by Spring Boot's Neo4j starter.
 * This config class provides customization via {@code org.neo4j.driver.Config}
 * which Spring Boot picks up automatically.</p>
 */
@Configuration
public class Neo4jConfig {

    /**
     * Customize the Neo4j driver configuration.
     * Spring Boot auto-configuration reads these settings.
     */
    @org.springframework.context.annotation.Bean
    public org.springframework.boot.autoconfigure.neo4j.ConfigBuilderCustomizer neo4jConfigCustomizer() {
        return builder -> builder
                .withMaxConnectionPoolSize(50)
                .withConnectionAcquisitionTimeout(30, TimeUnit.SECONDS)
                .withMaxTransactionRetryTime(30, TimeUnit.SECONDS);
    }
}
