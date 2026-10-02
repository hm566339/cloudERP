package com.erp.account.modules.deliverychallan.mapper;

import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanItemResponse;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanProfileResponse;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface DeliveryChallanMapper {

    @Mapping(target = "customerName", source = "customer.customerName")
    DeliveryChallanResponse toResponse(DeliveryChallan entity);

    @Mapping(target = "customerName", source = "customer.customerName")
    DeliveryChallanProfileResponse toProfileResponse(DeliveryChallan entity);

    List<DeliveryChallanProfileResponse> toProfileResponseList(List<DeliveryChallan> entities);

    @Mapping(target = "hsnSacCode", source = "hsnSacMaster.code")
    DeliveryChallanItemResponse toItemResponse(DeliveryChallanItem entity);
}
