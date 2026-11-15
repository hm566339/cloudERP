package com.erp.crm.modules.lead.mapper;

import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.lead.dto.request.LeadUpdateRequest;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.entity.CrmLeadProductInterest;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface LeadMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "leadCode", ignore = true)
    @Mapping(target = "displayName", ignore = true)
    @Mapping(target = "normalizedEmail", ignore = true)
    @Mapping(target = "normalizedPhone", ignore = true)
    @Mapping(target = "leadStage", ignore = true)
    @Mapping(target = "leadScore", ignore = true)
    @Mapping(target = "scoreGrade", ignore = true)
    @Mapping(target = "isQualified", ignore = true)
    @Mapping(target = "isConverted", ignore = true)
    @Mapping(target = "isLost", ignore = true)
    @Mapping(target = "isRecycled", ignore = true)
    @Mapping(target = "isDuplicate", ignore = true)
    CrmLead toEntity(LeadCreateRequest request);

    @Mapping(target = "leadSourceName", ignore = true)
    @Mapping(target = "leadStatusName", ignore = true)
    @Mapping(target = "leadStatusColor", ignore = true)
    @Mapping(target = "ownerUsername", ignore = true)
    @Mapping(target = "inquiredProducts", ignore = true)
    LeadResponse toResponse(CrmLead lead);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "leadCode", ignore = true)
    void updateEntityFromRequest(LeadUpdateRequest request, @MappingTarget CrmLead lead);

    LeadResponse.ProductInterestResponse toProductInterestResponse(CrmLeadProductInterest interest);
}
