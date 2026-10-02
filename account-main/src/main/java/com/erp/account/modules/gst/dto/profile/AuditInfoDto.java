package com.erp.account.modules.gst.dto.profile;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuditInfoDto {
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private boolean isActive;
}
