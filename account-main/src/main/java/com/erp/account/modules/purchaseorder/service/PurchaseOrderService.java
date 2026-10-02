package com.erp.account.modules.purchaseorder.service;

import com.erp.account.modules.purchaseorder.dto.PurchaseOrderFilterDto;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderRequest;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.purchaseorder.dto.POAdvanceRequest;

public interface PurchaseOrderService {

    PurchaseOrderResponse createPurchaseOrder(UUID companyId, PurchaseOrderRequest request);

    PurchaseOrderResponse createFromSupplierQuotation(UUID companyId, UUID quotationId);

    PurchaseOrderResponse updatePurchaseOrder(UUID companyId, UUID poId, PurchaseOrderRequest request);

    PurchaseOrderResponse getPurchaseOrderById(UUID companyId, UUID poId);

    Page<PurchaseOrderResponse> getAllPurchaseOrders(UUID companyId, Pageable pageable, PurchaseOrderFilterDto filter);

    PurchaseOrderResponse submitForApproval(UUID companyId, UUID poId);

    PurchaseOrderResponse approvePurchaseOrder(UUID companyId, UUID poId);

    PurchaseOrderResponse rejectPurchaseOrder(UUID companyId, UUID poId, String reason);

    PurchaseOrderResponse sendPurchaseOrder(UUID companyId, UUID poId);

    PurchaseOrderResponse cancelPurchaseOrder(UUID companyId, UUID poId, String reason);

    PurchaseOrderResponse closePurchaseOrder(UUID companyId, UUID poId);

    PurchaseOrderResponse overrideStatus(UUID companyId, UUID poId,
            com.erp.account.modules.purchaseorder.dto.PurchaseOrderStatusOverrideRequest request);

    PurchaseOrderResponse updateAdvanceRequirement(UUID companyId, UUID poId,
            com.erp.account.modules.purchaseorder.dto.PurchaseOrderAdvanceRequirementRequest request);

    void deletePurchaseOrder(UUID companyId, UUID poId);

    PaymentVoucherResponse createAdvancePayment(UUID companyId,
            UUID poId, POAdvanceRequest request);
}
