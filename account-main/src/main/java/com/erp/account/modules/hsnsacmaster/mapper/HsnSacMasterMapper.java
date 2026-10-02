package com.erp.account.modules.hsnsacmaster.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterRequest;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;

import java.util.List;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface HsnSacMasterMapper {

    @Mapping(source = "gstSlab.id", target = "gstSlabId")

    @Mapping(source = "gstSlab.slabName", target = "gstSlabName")
    @Mapping(source = "gstSlab.cgstRate", target = "cgstRate")
    @Mapping(source = "gstSlab.sgstRate", target = "sgstRate")
    @Mapping(source = "gstSlab.igstRate", target = "igstRate")
    @Mapping(source = "gstSlab.cessRate", target = "cessRate")
    @Mapping(source = "isDeleted", target = "deleted")
    HsnSacMasterResponse entityToResponse(HsnSacMaster entity);

    @Mapping(target = "id", ignore = true)

    @Mapping(target = "gstSlab", ignore = true)
    @Mapping(target = "taxTransactions", ignore = true)
    @Mapping(target = "salesInvoiceItems", ignore = true)
    HsnSacMaster requestToEntity(HsnSacMasterRequest request);

    void updateEntityFromRequest(HsnSacMasterRequest request, @MappingTarget HsnSacMaster entity);

    List<HsnSacMasterResponse> entityListToResponseList(List<HsnSacMaster> entities);
}
