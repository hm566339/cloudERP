package com.erp.account.modules.gst.mapper;

import com.erp.account.modules.gst.dto.request.GstStateRequest;
import com.erp.account.modules.gst.dto.response.GstStateCodeResponse;
import com.erp.account.modules.gst.entity.GstStateCode;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface GstStateCodeMapper {
    
    GstStateCode toEntity(GstStateRequest request);
    
    @Mapping(target = "displayName", expression = "java(entity.getStateCode() + \" - \" + entity.getStateName())")
    @Mapping(target = "countryCode", constant = "IN")
    @Mapping(target = "active", constant = "true")
    GstStateCodeResponse toResponse(GstStateCode entity);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(GstStateRequest request, @MappingTarget GstStateCode entity);
}
