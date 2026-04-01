package com.tatva.ingestion.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for registering a new ingestion source (RSS feed, API, etc.).
 */
public record SourceRequest(

        @NotBlank(message = "Name must not be blank")
        @Size(max = 255, message = "Name must be at most 255 characters")
        String name,

        @NotBlank(message = "Source type must not be blank")
        String sourceType,

        @NotBlank(message = "URL must not be blank")
        @Size(max = 2048, message = "URL must be at most 2048 characters")
        String url,

        @Min(value = 1, message = "Reliability tier minimum is 1")
        @Max(value = 5, message = "Reliability tier maximum is 5")
        int reliabilityTier,

        String domain,

        String scheduleCron
) {
    public SourceRequest {
        if (reliabilityTier < 1) reliabilityTier = 3;
        if (reliabilityTier > 5) reliabilityTier = 5;
    }
}
