package com.tatva.search.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

/**
 * Elasticsearch client configuration.
 * Uses Spring Data Elasticsearch's ElasticsearchConfiguration for auto-configured RestClient.
 */
@Configuration
public class ElasticsearchConfig extends ElasticsearchConfiguration {

    @Value("${spring.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUri;

    @Override
    public ClientConfiguration clientConfiguration() {
        return ClientConfiguration.builder()
                .connectedTo(elasticsearchUri.replace("http://", "").replace("https://", ""))
                .withConnectTimeout(5_000)
                .withSocketTimeout(30_000)
                .build();
    }
}
