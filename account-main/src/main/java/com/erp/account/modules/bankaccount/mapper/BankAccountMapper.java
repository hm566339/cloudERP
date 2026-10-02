package com.erp.account.modules.bankaccount.mapper;

import com.erp.account.modules.bankaccount.dto.response.BankAccountResponse;
import com.erp.account.modules.bankaccount.dto.request.BankAccountRequest;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface BankAccountMapper {

    @Mapping(target = "glAccount", ignore = true)
    BankAccount requestToEntity(BankAccountRequest request);

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "glAccount.id", target = "glAccountId")
    @Mapping(source = "glAccount.accountCode", target = "glAccountCode")
    @Mapping(source = "glAccount.accountName", target = "glAccountName")
    @Mapping(source = "glAccount.id", target = "ledgerAccountId")
    @Mapping(source = "glAccount.accountName", target = "ledgerAccountName")
    @Mapping(target = "currentBalance", ignore = true)
    @Mapping(target = "reconciledBalance", ignore = true)
    @Mapping(target = "transactionCount", ignore = true)
    @Mapping(target = "status", ignore = true)
    BankAccountResponse entityToResponse(BankAccount bankAccount);

    @Mapping(target = "glAccount", ignore = true)
    void updateEntityFromRequest(BankAccountRequest request, @MappingTarget BankAccount bankAccount);

    List<BankAccountResponse> entityListToResponseList(List<BankAccount> bankAccounts);
}
