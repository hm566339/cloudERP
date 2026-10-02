package com.erp.account.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Pagination parameters")
public class PaginationRequest {

    @Min(value = 1, message = "Page number must be at least 1")
    @Schema(description = "Page number (1-based)", example = "1")
    @Builder.Default
    private int page = 1;

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 500, message = "Page size must not exceed 500")
    @Schema(description = "Number of records per page", example = "20")
    @Builder.Default
    private int size = 20;

    /**
     * Convert 1-based page to 0-based for Spring's PageRequest.
     */
    @Schema(hidden = true)
    public int getZeroBasedPage() {
        return Math.max(0, this.page - 1);
    }
}
