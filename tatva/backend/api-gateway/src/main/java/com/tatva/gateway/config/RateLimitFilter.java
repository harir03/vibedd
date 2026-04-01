package com.tatva.gateway.config;

import com.tatva.gateway.security.JwtUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory rate limiting filter.
 * Limits requests per role per minute:
 * <ul>
 *   <li>ADMIN: 5000/min</li>
 *   <li>ANALYST: 500/min</li>
 *   <li>API_CONSUMER: 1000/min</li>
 *   <li>Public (unauthenticated): 60/min</li>
 * </ul>
 *
 * Uses a simple sliding window based on the current minute.
 * In production, replace with Redis-backed rate limiting.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    @Value("${tatva.rate-limit.admin:5000}")
    private int adminLimit;

    @Value("${tatva.rate-limit.analyst:500}")
    private int analystLimit;

    @Value("${tatva.rate-limit.api-consumer:1000}")
    private int apiConsumerLimit;

    @Value("${tatva.rate-limit.public:60}")
    private int publicLimit;

    // Map of "key:minuteBucket" → counter
    private final ConcurrentHashMap<String, AtomicInteger> counters = new ConcurrentHashMap<>();
    private volatile long currentMinute = System.currentTimeMillis() / 60_000;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        long minute = System.currentTimeMillis() / 60_000;

        // Reset counters on minute boundary
        if (minute != currentMinute) {
            currentMinute = minute;
            counters.clear();
        }

        String key = resolveRateLimitKey(request);
        int limit = resolveRateLimit();

        AtomicInteger counter = counters.computeIfAbsent(key + ":" + minute, k -> new AtomicInteger(0));
        int current = counter.incrementAndGet();

        response.setHeader("X-Rate-Limit-Limit", String.valueOf(limit));
        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(Math.max(0, limit - current)));

        if (current > limit) {
            log.warn("Rate limit exceeded for key: {} (count: {}, limit: {})", key, current, limit);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("""
                    {"type":"https://tatva.gov.in/errors/rate-limit","title":"Rate Limit Exceeded","status":429,"detail":"Too many requests. Please try again later."}
                    """.trim());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveRateLimitKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof JwtUserDetails details) {
            return "user:" + details.username();
        }
        // For unauthenticated requests, rate limit by IP
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }
        return "ip:" + ip;
    }

    private int resolveRateLimit() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getDetails() instanceof JwtUserDetails details) {
            return switch (details.role()) {
                case "ADMIN" -> adminLimit;
                case "ANALYST" -> analystLimit;
                case "API_CONSUMER" -> apiConsumerLimit;
                default -> publicLimit;
            };
        }
        return publicLimit;
    }
}
