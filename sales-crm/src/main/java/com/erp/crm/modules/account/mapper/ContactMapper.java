package com.erp.crm.modules.account.mapper;

import com.erp.crm.modules.account.dto.request.ContactCreateRequest;
import com.erp.crm.modules.account.dto.response.ContactResponse;
import com.erp.crm.modules.account.entity.CrmContact;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ContactMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contactCode", ignore = true)
    @Mapping(target = "displayName", ignore = true)
    @Mapping(target = "normalizedEmail", ignore = true)
    @Mapping(target = "normalizedPhone", ignore = true)
    CrmContact toEntity(ContactCreateRequest request);

    ContactResponse toResponse(CrmContact contact);
}
