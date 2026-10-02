package com.erp.account.modules.companyinitialization.dto;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
@Builder
public class CompanyInitializationResult {
    UUID companyId;
    String companyCode;
    @Singular
    List<InitializationStepResult> steps;
}
