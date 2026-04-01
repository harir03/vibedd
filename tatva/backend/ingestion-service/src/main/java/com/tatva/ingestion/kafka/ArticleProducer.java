package com.tatva.ingestion.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Kafka producer for publishing ingested articles to the raw.news.articles topic.
 */
@Component
public class ArticleProducer {

    private static final Logger log = LoggerFactory.getLogger(ArticleProducer.class);

    public static final String TOPIC = "raw.news.articles";
    public static final String DLQ_TOPIC = "raw.news.articles.dlq";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public ArticleProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Publish an article JSON to the raw.news.articles Kafka topic.
     *
     * @param key     message key (typically the content hash)
     * @param payload JSON-serialized article payload
     */
    public void publish(String key, String payload) {
        try {
            kafkaTemplate.send(TOPIC, key, payload)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish to {}: {}", TOPIC, ex.getMessage());
                            publishToDlq(key, payload, ex.getMessage());
                        } else {
                            log.debug("Published to {} partition={} offset={}",
                                    TOPIC,
                                    result.getRecordMetadata().partition(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.error("Error publishing to Kafka: {}", e.getMessage(), e);
            publishToDlq(key, payload, e.getMessage());
        }
    }

    /**
     * Send failed messages to the Dead Letter Queue.
     */
    public void publishToDlq(String key, String payload, String errorReason) {
        try {
            String dlqPayload = "{\"originalPayload\":" + payload
                    + ",\"error\":\"" + errorReason.replace("\"", "'") + "\"}";
            kafkaTemplate.send(DLQ_TOPIC, key, dlqPayload);
            log.warn("Message sent to DLQ {}: key={}", DLQ_TOPIC, key);
        } catch (Exception e) {
            log.error("Failed to publish to DLQ {}: {}", DLQ_TOPIC, e.getMessage(), e);
        }
    }
}
