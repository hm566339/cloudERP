package com.erp.account.modules.salesorder.service.v2;

import com.erp.account.common.exception.BusinessValidationException;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanItemRepository;
import com.erp.account.modules.salesorder.dto.response.v2.SalesOrderV2Response;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.mapper.SalesOrderV2Mapper;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderQueryServiceImpl implements SalesOrderQueryService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderV2Mapper salesOrderMapper;
    private final DeliveryChallanItemRepository deliveryChallanItemRepository;

    private static final Set<DeliveryChallanStatus> ACTIVE_DISPATCH_STATUSES = Set.of(
            DeliveryChallanStatus.CONFIRMED,
            DeliveryChallanStatus.DRAFT
    );

    @Override
    @Transactional(readOnly = true)
    public SalesOrderV2Response getSalesOrderById(UUID companyId, UUID salesOrderId) {
        log.info("Fetching Sales Order details for ID: {} and Company: {}", salesOrderId, companyId);

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        SalesOrder salesOrder = salesOrderRepository
                .findWithItemsAndCustomerByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, resolvedCompanyId)
                .orElseThrow(() -> new BusinessValidationException(
                        "SALES_ORDER_NOT_FOUND",
                        "id",
                        "Sales Order not found or you don't have access to it."));

        SalesOrderV2Response response = salesOrderMapper.toResponse(salesOrder);
        if (response != null && response.getItems() != null && !response.getItems().isEmpty()) {
            List<UUID> soItemIds = response.getItems().stream()
                    .map(SalesOrderV2Response.ItemDto::getId)
                    .filter(Objects::nonNull)
                    .toList();

            Map<UUID, BigDecimal> alreadyDispatchedMap = new HashMap<>();
            if (!soItemIds.isEmpty()) {
                List<Object[]> dispatchedRecords = deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(
                        soItemIds,
                        resolvedCompanyId,
                        ACTIVE_DISPATCH_STATUSES);

                if (dispatchedRecords != null) {
                    for (Object[] record : dispatchedRecords) {
                        UUID itemId = (UUID) record[0];
                        BigDecimal qty = record[1] instanceof BigDecimal bd ? bd : new BigDecimal(record[1].toString());
                        alreadyDispatchedMap.put(itemId, qty);
                    }
                }
            }

            boolean allFullyDispatched = true;
            boolean anyDispatched = false;

            for (SalesOrderV2Response.ItemDto itemDto : response.getItems()) {
                BigDecimal originalQty = itemDto.getQuantity() != null ? itemDto.getQuantity() : BigDecimal.ZERO;
                BigDecimal dispatched = alreadyDispatchedMap.getOrDefault(itemDto.getId(), BigDecimal.ZERO);
                BigDecimal remaining = originalQty.subtract(dispatched).max(BigDecimal.ZERO);

                itemDto.setDispatchedQuantity(dispatched);
                itemDto.setDeliveredQuantity(dispatched);
                itemDto.setRemainingQuantity(remaining);

                if (itemDto.getFulfillment() != null) {
                    itemDto.getFulfillment().setDispatchedQuantity(dispatched);
                    itemDto.getFulfillment().setDeliveredQuantity(dispatched);
                    itemDto.getFulfillment().setRemainingQuantity(remaining);
                }

                if (dispatched.compareTo(BigDecimal.ZERO) > 0) {
                    anyDispatched = true;
                }
                if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                    allFullyDispatched = false;
                }
            }

            if (allFullyDispatched && !response.getItems().isEmpty()) {
                response.setFulfillmentStatus("FULLY_DISPATCHED");
            } else if (anyDispatched) {
                response.setFulfillmentStatus("PARTIALLY_DISPATCHED");
            } else {
                response.setFulfillmentStatus("UNFULFILLED");
            }
        }

        return response;
    }
}
