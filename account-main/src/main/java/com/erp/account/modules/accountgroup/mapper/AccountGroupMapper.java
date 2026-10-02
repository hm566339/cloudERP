package com.erp.account.modules.accountgroup.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponse;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupRequest;
import com.erp.account.modules.accountgroup.entity.AccountGroup;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface AccountGroupMapper {

    /*
     * REQUEST -> ENTITY
     */
    AccountGroup toEntity(AccountGroupRequest request);

    /*
     * ENTITY UPDATE
     */
    void updateEntity(
            AccountGroupRequest request,
            @MappingTarget AccountGroup accountGroup
    );

    /*
     * ENTITY -> RESPONSE
     */
    @Mapping(source = "company.id", target = "companyId")

    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")

    @Mapping(source = "parentGroup.id", target = "parentGroupId")
    @Mapping(source = "parentGroup.name", target = "parentGroupName")
    @Mapping(source = "isDeleted", target = "deleted")

    AccountGroupResponse toResponse(AccountGroup accountGroup);
}
