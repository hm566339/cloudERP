package com.erp.account.modules.ledger.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.ledger.dto.request.ChartOfAccountRequest;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountResponse;
import com.erp.account.modules.ledger.entity.ChartOfAccount;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface ChartOfAccountMapper {

    ChartOfAccount toEntity(ChartOfAccountRequest request);

    void updateEntity(
            ChartOfAccountRequest request,
            @MappingTarget ChartOfAccount chartOfAccount
    );

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "group.id", target = "groupId")
    @Mapping(source = "group.name", target = "groupName")
    @Mapping(source = "parentAccount.id", target = "parentAccountId")
    @Mapping(source = "parentAccount.accountCode", target = "parentAccountCode")
    @Mapping(source = "isDeleted", target = "deleted")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    @Mapping(source = "createdBy", target = "createdBy")
    @Mapping(source = "updatedBy", target = "updatedBy")
    ChartOfAccountResponse toResponse(ChartOfAccount chartOfAccount);
}
