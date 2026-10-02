package com.erp.manufacturing.bom.dto.request;

import com.erp.manufacturing.common.enums.BomRevisionStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter
public class BomRevisionCreateRequest {
    @NotNull private UUID companyId;
    @NotNull private UUID bomId;
    @NotNull private Integer revisionNumber;
    @Size(max = 255) private String revisionLabel;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    @NotNull private BomRevisionStatus status;
    private String changeReason;
}
