package com.erp.account.common.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Sorting parameters")
public class SortRequest {

    @Schema(description = "Field to sort by", example = "invoiceDate")
    @Builder.Default
    private String field = "invoiceDate";

    @Pattern(regexp = "^(ASC|DESC)$", message = "Sort direction must be ASC or DESC")
    @Schema(description = "Sort direction", example = "DESC")
    @Builder.Default
    private String direction = "DESC";
}
