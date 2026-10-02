package com.erp.manufacturing.bom.dto.request;

import com.erp.manufacturing.common.enums.BomStatus;
import com.erp.manufacturing.common.enums.BomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class BomCreateRequest {
    @NotNull private UUID companyId;
    @NotBlank @Size(max = 255) private String bomNumber;
    @NotNull private UUID finishedProductId;
    @NotBlank @Size(max = 255) private String name;
    private String description;
    @NotNull private BomType bomType;
    @NotNull private BomStatus status;
    @NotNull private Boolean isDefault;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    @NotNull private Integer currentRevision;
}
