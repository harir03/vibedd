package com.tatva.ingestion.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SHA-256 content deduplication service.
 * Uses an in-memory set as a bloom-filter substitute for T1.
 * In production, this would use a Redis bloom filter (BF.EXISTS / BF.ADD).
 */
@Service
public class DeduplicationService {

    private static final Logger log = LoggerFactory.getLogger(DeduplicationService.class);

    // In-memory dedup set (Redis bloom filter in production)
    private final Set<String> seenHashes = ConcurrentHashMap.newKeySet();

    /**
     * Compute SHA-256 hash of content and check if it's been seen before.
     *
     * @param title     article title
     * @param content   first 500 characters of content
     * @param sourceUrl the source URL
     * @return true if this content is a duplicate, false if new
     */
    public boolean isDuplicate(String title, String content, String sourceUrl) {
        String hash = computeHash(title, content, sourceUrl);
        boolean alreadySeen = !seenHashes.add(hash);
        if (alreadySeen) {
            log.debug("Duplicate detected: hash={}", hash);
        }
        return alreadySeen;
    }

    /**
     * Compute SHA-256 hash of title + first 500 chars of content + URL.
     */
    public String computeHash(String title, String content, String sourceUrl) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = normalize(title) + "|"
                    + normalize(content).substring(0, Math.min(500, normalize(content).length())) + "|"
                    + normalize(sourceUrl);
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Clear the dedup set (for testing or periodic reset).
     */
    public void clear() {
        seenHashes.clear();
    }

    public int size() {
        return seenHashes.size();
    }

    private String normalize(String input) {
        return input == null ? "" : input.trim().toLowerCase();
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
