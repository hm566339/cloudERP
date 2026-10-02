package com.erp.account.modules.gst.mapper;

import com.erp.account.modules.gst.dto.request.GstRegistrationRequest;
import com.erp.account.modules.gst.dto.response.GstRegistrationResponse;
import com.erp.account.modules.gst.entity.GstRegistration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, GstStateCodeMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface GstRegistrationMapper {

    @Mapping(target = "stateCode", ignore = true) // Will be set in service
    GstRegistration toEntity(GstRegistrationRequest request);

    @Mapping(target = "company", expression = "java(mapEntityReference(entity.getCompanyId()))")
    @Mapping(target = "branch", expression = "java(mapEntityReference(entity.getBranchId()))")
    @Mapping(target = "isDefault", source = "default")
    GstRegistrationResponse toResponse(GstRegistration entity);

    default GstRegistrationResponse.EntityReference mapEntityReference(java.util.UUID id) {
        if (id == null) return null;
        return GstRegistrationResponse.EntityReference.builder().id(id).build();
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "stateCode", ignore = true) // Will be set in service
    @Mapping(target = "default", source = "isDefault")
    void updateEntityFromRequest(GstRegistrationRequest request, @MappingTarget GstRegistration entity);
}
