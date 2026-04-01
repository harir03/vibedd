package com.tatva.search.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for search queries.
 */
public record SearchRequest(

        @NotBlank(message = "Query string must not be blank")
        @Size(max = 500, message = "Query must be at most 500 characters")
        String query,

        String domain,

        String type,

        @Min(value = 0, message = "Clearance level minimum is 0")
        @Max(value = 5, message = "Clearance level maximum is 5")
        int clearanceLevel,

        @Min(value = 0, message = "Page must be >= 0")
        int page,

        @Min(value = 1, message = "Size must be >= 1")
        @Max(value = 100, message = "Size must be <= 100")
        int size
) {
    public SearchRequest {
        if (page < 0) page = 0;
        if (size <= 0) size = 20;
        if (size > 100) size = 100;
    }
}
