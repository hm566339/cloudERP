package com.erp.account.modules.accountingperiod.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponse;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodRequest;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface AccountingPeriodMapper {

    AccountingPeriod toEntity(AccountingPeriodRequest request);

    AccountingPeriodRequest toDto(AccountingPeriod accountingPeriod);

    void updateEntity(
            AccountingPeriodRequest request,
            @MappingTarget AccountingPeriod accountingPeriod);

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "fiscalYear.id", target = "fiscalYearId")
    AccountingPeriodResponse toResponse(AccountingPeriod accountingPeriod);
}
