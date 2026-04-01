package com.tatva.gateway.security;

/**
 * Lightweight user details record attached to the SecurityContext
 * after JWT authentication. Carries role and clearance level for
 * downstream authorization checks.
 */
public record JwtUserDetails(
        String userId,
        String username,
        String role,
        int clearanceLevel
) {
}
