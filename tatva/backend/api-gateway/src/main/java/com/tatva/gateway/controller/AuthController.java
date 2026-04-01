package com.tatva.gateway.controller;

import com.tatva.gateway.dto.LoginRequest;
import com.tatva.gateway.dto.TokenResponse;
import com.tatva.gateway.model.User;
import com.tatva.gateway.repository.UserRepository;
import com.tatva.gateway.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * Authentication controller — handles login and token refresh.
 * Validates credentials against the PostgreSQL users table.
 * Returns JWT tokens (RS256 signed) on success.
 * Uses RFC 7807 ProblemDetail for error responses.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * POST /api/auth/login — Authenticate user and return JWT tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByUsernameAndIsActiveTrue(request.username())
                .orElse(null);

        if (user == null || !verifyPassword(request.password(), user.getPasswordHash())) {
            log.warn("Failed login attempt for username: {}", request.username());
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "Invalid username or password"
            );
            problem.setTitle("Authentication Failed");
            problem.setType(URI.create("https://tatva.gov.in/errors/auth-failed"));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(),
                user.getUsername(),
                user.getRole(),
                user.getClearanceLevel()
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getId().toString(),
                user.getUsername()
        );

        long expiresIn = jwtTokenProvider.getAccessTokenExpiryMinutes() * 60;

        log.info("Successful login: user={}, role={}", user.getUsername(), user.getRole());

        return ResponseEntity.ok(TokenResponse.loginResponse(
                accessToken, refreshToken, expiresIn,
                user.getUsername(), user.getRole(), user.getClearanceLevel()
        ));
    }

    /**
     * POST /api/auth/refresh — Exchange a valid refresh token for a new access token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header"
            );
            problem.setTitle("Token Required");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        String refreshToken = authHeader.substring(7).trim();
        Claims claims = jwtTokenProvider.validateToken(refreshToken);

        if (claims == null) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"
            );
            problem.setTitle("Token Invalid");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        String tokenType = claims.get("type", String.class);
        if (!"refresh".equals(tokenType)) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "Token is not a refresh token"
            );
            problem.setTitle("Wrong Token Type");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        String userId = claims.getSubject();
        String username = claims.get("username", String.class);

        // Re-fetch user to get current role and clearance (may have changed)
        User user = userRepository.findByUsernameAndIsActiveTrue(username).orElse(null);
        if (user == null) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "User account is no longer active"
            );
            problem.setTitle("Account Deactivated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                userId, username, user.getRole(), user.getClearanceLevel()
        );
        long expiresIn = jwtTokenProvider.getAccessTokenExpiryMinutes() * 60;

        log.info("Token refreshed for user: {}", username);

        return ResponseEntity.ok(TokenResponse.refreshResponse(
                newAccessToken, expiresIn,
                user.getUsername(), user.getRole(), user.getClearanceLevel()
        ));
    }

    /**
     * Verify password against the stored hash.
     * PostgreSQL uses pgcrypto's crypt() with bf (bcrypt). We need to verify
     * using BCrypt. The bcrypt hash from PostgreSQL's crypt() function is
     * compatible with Spring's BCryptPasswordEncoder.
     */
    private boolean verifyPassword(String rawPassword, String storedHash) {
        try {
            return passwordEncoder.matches(rawPassword, storedHash);
        } catch (Exception e) {
            log.error("Password verification error: {}", e.getMessage());
            return false;
        }
    }
}
