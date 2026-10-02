package com.erp.account.modules.budget.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.budget.dto.response.BudgetHeaderResponse;
import com.erp.account.modules.budget.dto.request.BudgetHeaderRequest;
import com.erp.account.modules.budget.entity.BudgetHeader;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface BudgetHeaderMapper {

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "fiscalYear.id", target = "fiscalYearId")
    @Mapping(source = "fiscalYear.fiscalYear", target = "fiscalYearName")
    BudgetHeaderResponse entityToResponse(BudgetHeader entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "fiscalYear", ignore = true)
    @Mapping(target = "budgetLines", ignore = true)
    BudgetHeader requestToEntity(BudgetHeaderRequest request);

    void updateEntityFromRequest(BudgetHeaderRequest request, @MappingTarget BudgetHeader entity);

    List<BudgetHeaderResponse> entityListToResponseList(List<BudgetHeader> entities);
}
