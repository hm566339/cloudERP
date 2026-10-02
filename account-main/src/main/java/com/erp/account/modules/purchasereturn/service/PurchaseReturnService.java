package com.erp.account.modules.purchasereturn.service;

import com.erp.account.modules.purchasereturn.dto.PurchaseReturnRequest;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface PurchaseReturnService {

    PurchaseReturnResponse createPurchaseReturn(UUID companyId, PurchaseReturnRequest request);

    PurchaseReturnResponse confirmPurchaseReturn(UUID companyId, UUID returnId);

    /**
     * Cancels a Purchase Return.
     * - DRAFT returns: set CANCELLED immediately.
     * - CONFIRMED returns: reverse returnedQuantity on GRN items, cancel pending outbox task, then CANCELLED.
     */
    PurchaseReturnResponse cancelPurchaseReturn(UUID companyId, UUID returnId, String reason);

    PurchaseReturnResponse getPurchaseReturnById(UUID companyId, UUID returnId);

    Page<PurchaseReturnResponse> getAllPurchaseReturns(UUID companyId, Pageable pageable);

    List<PurchaseReturnResponse> getPurchaseReturnsByGoodsReceiptId(UUID companyId, UUID grnId);
}
