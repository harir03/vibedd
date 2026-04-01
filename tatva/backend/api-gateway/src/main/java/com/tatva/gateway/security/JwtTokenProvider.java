package com.tatva.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Token Provider using RS256 (RSA SHA-256) signing.
 * Generates RSA key pair at startup. Access tokens expire in 15 minutes,
 * refresh tokens expire in 24 hours.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${tatva.jwt.access-token-expiry-minutes:15}")
    private long accessTokenExpiryMinutes;

    @Value("${tatva.jwt.refresh-token-expiry-hours:24}")
    private long refreshTokenExpiryHours;

    @Value("${tatva.jwt.issuer:tatva-gateway}")
    private String issuer;

    private RSAPublicKey publicKey;
    private RSAPrivateKey privateKey;

    @PostConstruct
    public void init() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            this.publicKey = (RSAPublicKey) keyPair.getPublic();
            this.privateKey = (RSAPrivateKey) keyPair.getPrivate();
            log.info("RS256 key pair generated successfully");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to generate RSA key pair", e);
        }
    }

    /**
     * Generate an access token (short-lived, 15 min default).
     */
    public String generateAccessToken(String userId, String username, String role, int clearanceLevel) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(accessTokenExpiryMinutes * 60);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .subject(userId)
                .claim("username", username)
                .claim("role", role)
                .claim("clearance", clearanceLevel)
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    /**
     * Generate a refresh token (long-lived, 24h default).
     */
    public String generateRefreshToken(String userId, String username) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(refreshTokenExpiryHours * 3600);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .subject(userId)
                .claim("username", username)
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    /**
     * Validate token and return claims. Returns null if invalid.
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(publicKey)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
            return null;
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extract the user ID (subject) from a token without full validation.
     * Use validateToken() for secure operations.
     */
    public String getUserIdFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.getSubject() : null;
    }

    public String getRoleFromToken(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    public String getTokenType(String token) {
        Claims claims = validateToken(token);
        return claims != null ? claims.get("type", String.class) : null;
    }

    // Visible for testing
    public RSAPublicKey getPublicKey() {
        return publicKey;
    }

    public long getAccessTokenExpiryMinutes() {
        return accessTokenExpiryMinutes;
    }

    public long getRefreshTokenExpiryHours() {
        return refreshTokenExpiryHours;
    }
}
