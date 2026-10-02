package com.erp.account.modules.fiscalyear.dto.response;

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
public class FyYearEndInfoDto {
    private String closingStatus;
    private UUID closedBy;
    private LocalDate closedDate;
    private String closingRemarks;
}
