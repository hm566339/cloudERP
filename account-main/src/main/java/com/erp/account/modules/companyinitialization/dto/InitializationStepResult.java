package com.erp.account.modules.companyinitialization.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InitializationStepResult {
    String step;
    int createdCount;
    int existingCount;
}
