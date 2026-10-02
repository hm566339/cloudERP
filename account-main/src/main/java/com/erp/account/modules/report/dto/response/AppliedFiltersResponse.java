package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Strongly-typed metadata for the applied filters during report generation")
public class AppliedFiltersResponse extends BaseResponseDto  {
    
    @Schema(description = "Company UUID filter", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID companyId;

    @Schema(description = "Account UUID filter", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID accountId;

    @Schema(description = "Start date of the ledger", example = "2026-01-01")
    private LocalDate fromDate;

    @Schema(description = "End date of the ledger", example = "2026-12-31")
    private LocalDate toDate;

    @Schema(description = "Journal entry posting status filter", example = "POSTED")
    private String status;

    @Schema(description = "Branch UUID filter", example = "123e4567-e89b-12d3-a456-426614174002")
    private UUID branchId;

    @Schema(description = "Cost Center UUID filter", example = "123e4567-e89b-12d3-a456-426614174003")
    private UUID costCenterId;

    @Schema(description = "Project UUID filter", example = "123e4567-e89b-12d3-a456-426614174004")
    private UUID projectId;
}
