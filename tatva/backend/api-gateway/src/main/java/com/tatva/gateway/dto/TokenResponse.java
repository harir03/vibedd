package com.tatva.gateway.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * JWT token response DTO. Returned on successful login or token refresh.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        String username,
        String role,
        int clearanceLevel
) {
    /**
     * Factory for login response (both tokens).
     */
    public static TokenResponse loginResponse(String accessToken, String refreshToken,
                                               long expiresInSeconds, String username,
                                               String role, int clearanceLevel) {
        return new TokenResponse(accessToken, refreshToken, "Bearer",
                expiresInSeconds, username, role, clearanceLevel);
    }

    /**
     * Factory for refresh response (new access token only).
     */
    public static TokenResponse refreshResponse(String accessToken, long expiresInSeconds,
                                                  String username, String role, int clearanceLevel) {
        return new TokenResponse(accessToken, null, "Bearer",
                expiresInSeconds, username, role, clearanceLevel);
    }
}
