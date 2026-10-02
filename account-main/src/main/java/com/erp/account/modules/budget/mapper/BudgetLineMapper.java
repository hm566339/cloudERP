package com.erp.account.modules.budget.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.Named;

import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.modules.budget.entity.BudgetLine;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface BudgetLineMapper {

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "budgetHeader.id", target = "budgetHeaderId")
    @Mapping(source = "account.id", target = "accountId")
    @Mapping(source = "account.accountCode", target = "accountCode")
    @Mapping(source = "account.accountName", target = "accountName")
    @Mapping(target = "actualExpense", ignore = true)
    @Mapping(target = "remainingAmount", ignore = true)
    @Mapping(target = "utilizationPercentage", ignore = true)
    @Mapping(target = "varianceAmount", ignore = true)
    @Mapping(target = "variancePercentage", ignore = true)
    @Mapping(target = "varianceType", ignore = true)
    BudgetLineResponse entityToResponse(BudgetLine entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "budgetHeader", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "utilizedAmount", ignore = true)
    BudgetLine requestToEntity(BudgetLineRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "budgetHeader", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "utilizedAmount", ignore = true)
    void updateEntityFromRequest(BudgetLineRequest request, @MappingTarget BudgetLine entity);

    List<BudgetLineResponse> entityListToResponseList(List<BudgetLine> entities);

    @Named("calculateRemainingAmount")
    default BigDecimal calculateRemainingAmount(BudgetLine entity) {
        if (entity == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal allocated = entity.getAllocatedAmount() != null ? entity.getAllocatedAmount() : BigDecimal.ZERO;
        BigDecimal utilized = entity.getUtilizedAmount() != null ? entity.getUtilizedAmount() : BigDecimal.ZERO;
        return allocated.subtract(utilized);
    }
}
