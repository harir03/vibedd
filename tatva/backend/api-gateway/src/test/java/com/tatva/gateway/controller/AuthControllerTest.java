package com.tatva.gateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tatva.gateway.dto.LoginRequest;
import com.tatva.gateway.model.User;
import com.tatva.gateway.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for AuthController — tests login, RBAC, token refresh,
 * and public endpoints using Spring Boot test context with H2 in-memory DB.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // Seed test users
        createUser("admin", "admin@tatva.gov.in", "admin123", "ADMIN", 5);
        createUser("analyst", "analyst@tatva.gov.in", "analyst123", "ANALYST", 3);
        createUser("viewer", "viewer@tatva.gov.in", "viewer123", "VIEWER", 1);
    }

    @Test
    @DisplayName("POST /api/auth/login with valid admin credentials → 200 + JWT")
    void loginWithValidCredentialsReturnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "admin123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.clearanceLevel").value(5))
                .andExpect(jsonPath("$.expiresIn").value(900)); // 15 min = 900 sec
    }

    @Test
    @DisplayName("POST /api/auth/login with invalid credentials → 401")
    void loginWithInvalidCredentialsReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "wrongpassword"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Authentication Failed"));
    }

    @Test
    @DisplayName("POST /api/auth/login with non-existent user → 401")
    void loginWithNonExistentUserReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("ghost", "password123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login with blank username → 400 validation error")
    void loginWithBlankUsernameReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"","password":"admin123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/status without token → 200 (public)")
    void statusEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.system").value("TATVA Intelligence Platform"))
                .andExpect(jsonPath("$.status").value("OPERATIONAL"));
    }

    @Test
    @DisplayName("GET /health without token → 200 (public)")
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/graph/entities without token → 401")
    void protectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/graph/entities"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/graph/entities with ANALYST token → permitted (not 401/403)")
    void protectedEndpointWithAnalystTokenIsPermitted() throws Exception {
        String token = loginAndGetToken("analyst", "analyst123");

        // The request goes through auth (no 401/403) but may 404 since graph-service
        // isn't running. We verify it's NOT 401 or 403.
        MvcResult result = mockMvc.perform(get("/api/v1/graph/entities")
                        .header("Authorization", "Bearer " + token))
                .andReturn();

        int status = result.getResponse().getStatus();
        assertThat(status).isNotEqualTo(401).isNotEqualTo(403);
    }

    @Test
    @DisplayName("GET /api/v1/ingestion/sources with ANALYST token → 403 (ADMIN only)")
    void ingestionEndpointWithAnalystTokenReturns403() throws Exception {
        String token = loginAndGetToken("analyst", "analyst123");

        mockMvc.perform(get("/api/v1/ingestion/sources")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/audit/logs with ANALYST token → 403 (ADMIN only)")
    void auditEndpointWithAnalystTokenReturns403() throws Exception {
        String token = loginAndGetToken("analyst", "analyst123");

        mockMvc.perform(get("/api/v1/audit/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/ingestion/sources with ADMIN token → not 401/403")
    void ingestionEndpointWithAdminTokenIsPermitted() throws Exception {
        String token = loginAndGetToken("admin", "admin123");

        MvcResult result = mockMvc.perform(get("/api/v1/ingestion/sources")
                        .header("Authorization", "Bearer " + token))
                .andReturn();

        int status = result.getResponse().getStatus();
        assertThat(status).isNotEqualTo(401).isNotEqualTo(403);
    }

    @Test
    @DisplayName("GET /api/v1/graph/entities with VIEWER token → 403 (ANALYST+ required)")
    void graphEndpointWithViewerTokenReturns403() throws Exception {
        String token = loginAndGetToken("viewer", "viewer123");

        mockMvc.perform(get("/api/v1/graph/entities")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/auth/refresh with valid refresh token → new access token")
    void refreshWithValidTokenReturnsNewAccessToken() throws Exception {
        // Login first to get refresh token
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("analyst", "analyst123"))))
                .andExpect(status().isOk())
                .andReturn();

        String refreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.username").value("analyst"))
                .andExpect(jsonPath("$.role").value("ANALYST"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh with access token (not refresh) → 401")
    void refreshWithAccessTokenReturns401() throws Exception {
        String accessToken = loginAndGetToken("admin", "admin123");

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Wrong Token Type"));
    }

    // ---- Helpers ----

    private String loginAndGetToken(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(username, password))))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    private void createUser(String username, String email, String rawPassword, String role, int clearance) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setClearanceLevel(clearance);
        user.setActive(true);
        user.setMfaEnabled(false);
        user.setMaxSessions(3);
        userRepository.save(user);
    }
}
