package com.erp.account.modules.salesorder.service;

import com.erp.account.modules.salesorder.dto.request.SOConversionRequest;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderProfileResponse;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;

import java.util.UUID;

public interface SalesOrderService {

    SalesOrderResponse createFromProformaInvoice(UUID companyId, UUID piId, SOConversionRequest request);

    SalesOrderResponse createDirectFromQuotation(UUID companyId, UUID quotationId);

    SalesOrderProfileResponse getSalesOrderById(UUID companyId, UUID id);

    SalesOrderResponse changeStatus(UUID companyId, UUID id, SalesOrderStatus newStatus);

    SalesOrderResponse submitForApproval(UUID companyId, UUID id, String comments);

    default SalesOrderResponse submitForApproval(UUID companyId, UUID id) {
        return submitForApproval(companyId, id, null);
    }

    SalesOrderResponse confirmSO(UUID companyId, UUID id);

    SalesOrderResponse cancelSO(UUID companyId, UUID id);

    org.springframework.data.domain.Page<SalesOrderResponse> getAllSalesOrders(
            UUID companyId,
            org.springframework.data.domain.Pageable pageable,
            SalesOrderStatus status,
            UUID customerId,
            java.time.LocalDate fromDate,
            java.time.LocalDate toDate,
            String search
    );

    SalesOrderResponse updateSalesOrder(UUID companyId, UUID id, com.erp.account.modules.salesorder.dto.request.SalesOrderUpdateRequest request);

    com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse generateInvoiceFromSalesOrder(UUID companyId, UUID salesOrderId);
}
