package com.erp.account.modules.accountcategory.mapper;

import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponse;
import com.erp.account.modules.accountcategory.dto.request.AccountCategoryRequest;
import com.erp.account.modules.accountcategory.entity.AccountCategory;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface AccountCategoryMapper {

    /*
     * REQUEST -> ENTITY
     */
    AccountCategory toEntity(AccountCategoryRequest request);

    /*
     * ENTITY UPDATE
     */
    void updateEntity(
            AccountCategoryRequest request,
            @MappingTarget AccountCategory accountCategory);

    /*
     * ENTITY -> RESPONSE
     */
    @Mapping(source = "company.id", target = "companyId")
    AccountCategoryResponse toResponse(AccountCategory accountCategory);
}
