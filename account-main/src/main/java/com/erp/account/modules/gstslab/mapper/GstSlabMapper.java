package com.erp.account.modules.gstslab.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.gstslab.dto.response.GstSlabResponse;
import com.erp.account.modules.gstslab.dto.request.GstSlabRequest;
import com.erp.account.modules.gstslab.entity.GstSlab;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface GstSlabMapper {

    GstSlab toEntity(GstSlabRequest request);

    void updateEntity(GstSlabRequest request,
                      @MappingTarget GstSlab gstSlab);

    GstSlabResponse toResponse(GstSlab gstSlab);
}
