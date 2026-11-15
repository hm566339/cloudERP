package com.erp.crm.modules.account.mapper;

import com.erp.crm.modules.account.dto.request.AccountCreateRequest;
import com.erp.crm.modules.account.dto.request.AddressRequest;
import com.erp.crm.modules.account.dto.response.AccountResponse;
import com.erp.crm.modules.account.dto.response.AddressResponse;
import com.erp.crm.modules.account.entity.CrmAccount;
import com.erp.crm.modules.account.entity.CrmAddress;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface AccountMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "accountCode", ignore = true)
    @Mapping(target = "accountMainCustomerId", ignore = true)
    CrmAccount toEntity(AccountCreateRequest request);

    AccountResponse toResponse(CrmAccount account);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "entityType", ignore = true)
    @Mapping(target = "entityId", ignore = true)
    CrmAddress toAddressEntity(AddressRequest request);

    AddressResponse toAddressResponse(CrmAddress address);
}
