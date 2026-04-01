package com.tatva.ingestion.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * RSS/Atom feed connector.
 * Fetches and parses RSS 2.0 / Atom feeds into article maps.
 * Uses lightweight XML parsing (regex-based for T1 — SAX/StAX in production).
 */
@Service
public class RssFeedConnector {

    private static final Logger log = LoggerFactory.getLogger(RssFeedConnector.class);

    private static final int CONNECT_TIMEOUT = 10_000; // 10 seconds
    private static final int READ_TIMEOUT = 30_000;    // 30 seconds

    // Simple regex patterns for RSS item fields
    private static final Pattern ITEM_PATTERN = Pattern.compile(
            "<item>(.*?)</item>", Pattern.DOTALL);
    private static final Pattern TITLE_PATTERN = Pattern.compile(
            "<title><!\\[CDATA\\[(.*?)]]>|<title>(.*?)</title>", Pattern.DOTALL);
    private static final Pattern LINK_PATTERN = Pattern.compile(
            "<link><!\\[CDATA\\[(.*?)]]>|<link>(.*?)</link>", Pattern.DOTALL);
    private static final Pattern DESC_PATTERN = Pattern.compile(
            "<description><!\\[CDATA\\[(.*?)]]>|<description>(.*?)</description>", Pattern.DOTALL);
    private static final Pattern PUB_DATE_PATTERN = Pattern.compile(
            "<pubDate>(.*?)</pubDate>", Pattern.DOTALL);

    /**
     * Fetch and parse an RSS feed URL.
     *
     * @param feedUrl the RSS/Atom feed URL
     * @return list of article maps with keys: title, link, description, pubDate
     */
    public List<Map<String, String>> fetchFeed(String feedUrl) {
        List<Map<String, String>> articles = new ArrayList<>();

        try {
            String xml = fetchUrl(feedUrl);
            if (xml == null || xml.isBlank()) {
                log.warn("Empty response from feed: {}", feedUrl);
                return articles;
            }

            Matcher itemMatcher = ITEM_PATTERN.matcher(xml);
            while (itemMatcher.find()) {
                String itemXml = itemMatcher.group(1);
                Map<String, String> article = new LinkedHashMap<>();

                article.put("title", extractField(TITLE_PATTERN, itemXml));
                article.put("link", extractField(LINK_PATTERN, itemXml));
                article.put("description", extractField(DESC_PATTERN, itemXml));
                article.put("pubDate", extractField(PUB_DATE_PATTERN, itemXml));
                article.put("feedUrl", feedUrl);

                articles.add(article);
            }

            log.info("Fetched {} articles from {}", articles.size(), feedUrl);
        } catch (Exception e) {
            log.error("Failed to fetch RSS feed {}: {}", feedUrl, e.getMessage(), e);
        }

        return articles;
    }

    private String fetchUrl(String url) {
        try {
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(CONNECT_TIMEOUT);
            conn.setReadTimeout(READ_TIMEOUT);
            conn.setRequestProperty("User-Agent", "TATVA-Ingestion/1.0");

            int status = conn.getResponseCode();
            if (status != 200) {
                log.warn("HTTP {} from {}", status, url);
                return null;
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                return sb.toString();
            }
        } catch (Exception e) {
            log.error("HTTP fetch failed for {}: {}", url, e.getMessage());
            return null;
        }
    }

    private String extractField(Pattern pattern, String xml) {
        Matcher m = pattern.matcher(xml);
        if (m.find()) {
            // group(1) = CDATA content, group(2) = plain content
            String value = m.group(1) != null ? m.group(1) : m.group(2);
            return value != null ? value.trim() : "";
        }
        return "";
    }
}
