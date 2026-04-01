package com.tatva.ingestion.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the DeduplicationService.
 * Verifies SHA-256 hashing and duplicate detection logic.
 */
class DeduplicationServiceTest {

    private DeduplicationService deduplicationService;

    @BeforeEach
    void setUp() {
        deduplicationService = new DeduplicationService();
    }

    @Test
    @DisplayName("First ingestion of an article → not a duplicate")
    void firstArticleIsNotDuplicate() {
        boolean result = deduplicationService.isDuplicate(
                "India signs defense deal with France",
                "India and France signed a major defense deal...",
                "https://reuters.com/article/123"
        );
        assertFalse(result);
    }

    @Test
    @DisplayName("Same article ingested twice → second is duplicate")
    void sameArticleTwiceIsDuplicate() {
        String title = "India signs defense deal";
        String content = "The deal includes Rafale jets and submarines...";
        String url = "https://reuters.com/article/456";

        assertFalse(deduplicationService.isDuplicate(title, content, url));
        assertTrue(deduplicationService.isDuplicate(title, content, url));
    }

    @Test
    @DisplayName("Different articles are not duplicates")
    void differentArticlesNotDuplicate() {
        assertFalse(deduplicationService.isDuplicate("Article A", "Content A", "https://a.com"));
        assertFalse(deduplicationService.isDuplicate("Article B", "Content B", "https://b.com"));
        assertEquals(2, deduplicationService.size());
    }

    @Test
    @DisplayName("Hash is case-insensitive (normalized)")
    void hashIsCaseInsensitive() {
        String title1 = "India Defense Deal";
        String title2 = "india defense deal";
        String content = "Same content";
        String url = "https://example.com/1";

        assertFalse(deduplicationService.isDuplicate(title1, content, url));
        assertTrue(deduplicationService.isDuplicate(title2, content, url));
    }

    @Test
    @DisplayName("Hash handles null inputs gracefully")
    void hashHandlesNulls() {
        assertFalse(deduplicationService.isDuplicate(null, null, null));
        assertTrue(deduplicationService.isDuplicate(null, null, null));
    }

    @Test
    @DisplayName("Content hash is deterministic")
    void hashIsDeterministic() {
        String hash1 = deduplicationService.computeHash("Title", "Content", "https://url.com");
        String hash2 = deduplicationService.computeHash("Title", "Content", "https://url.com");
        assertEquals(hash1, hash2);
        assertEquals(64, hash1.length()); // SHA-256 = 64 hex characters
    }

    @Test
    @DisplayName("Clear resets the dedup set")
    void clearResetsState() {
        deduplicationService.isDuplicate("X", "Y", "Z");
        assertEquals(1, deduplicationService.size());
        deduplicationService.clear();
        assertEquals(0, deduplicationService.size());
        assertFalse(deduplicationService.isDuplicate("X", "Y", "Z"));
    }
}
