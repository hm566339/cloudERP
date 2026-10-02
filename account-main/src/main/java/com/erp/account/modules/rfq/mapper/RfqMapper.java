package com.erp.account.modules.rfq.mapper;

import com.erp.account.modules.rfq.dto.RfqItemRequest;
import com.erp.account.modules.rfq.dto.RfqResponse;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.rfq.entity.RfqItem;
import com.erp.account.modules.rfq.entity.RfqVendor;
import com.erp.account.modules.rfq.entity.RfqVendorResponseStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RfqMapper {

    RfqResponse toResponse(Rfq rfq);

    List<RfqResponse> toResponseList(List<Rfq> rfqs);

    RfqResponse.Item toItemResponse(RfqItem item);

    List<RfqResponse.Item> toItemResponseList(List<RfqItem> items);

    @Mapping(target = "status", source = "responseStatus")
    @Mapping(target = "vendorName", source = "vendor.vendorName")
    RfqResponse.Vendor toVendorResponse(RfqVendor vendor);

    List<RfqResponse.Vendor> toVendorResponseList(List<RfqVendor> vendors);

    RfqResponse.RfqVendorStatus toVendorStatus(RfqVendorResponseStatus status);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "companyId", ignore = true)
    @Mapping(target = "rfq", ignore = true)
    RfqItem toItemEntity(RfqItemRequest request);
}
