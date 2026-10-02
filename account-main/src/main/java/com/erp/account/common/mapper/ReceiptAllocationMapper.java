package com.erp.account.common.mapper;

import com.erp.account.modules.receiptvoucher.dto.response.ReceiptAllocationResponse;
import com.erp.account.common.dto.request.ReceiptAllocationRequest;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import java.util.List;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface ReceiptAllocationMapper {
    ReceiptAllocation requestToEntity(ReceiptAllocationRequest req);
    ReceiptAllocationResponse entityToResponse(ReceiptAllocation entity);
    List<ReceiptAllocationResponse> entityListToResponseList(List<ReceiptAllocation> list);
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(ReceiptAllocationRequest req, @MappingTarget ReceiptAllocation entity);
}
