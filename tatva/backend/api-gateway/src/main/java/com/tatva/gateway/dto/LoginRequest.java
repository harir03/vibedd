package com.tatva.gateway.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Login request DTO. Validated with Jakarta constraints.
 */
public record LoginRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 100, message = "Username must be 3-100 characters")
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 128, message = "Password must be 6-128 characters")
        String password
) {
}
