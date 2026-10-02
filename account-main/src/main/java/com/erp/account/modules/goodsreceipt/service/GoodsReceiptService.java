package com.erp.account.modules.goodsreceipt.service;

import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptFilterDto;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;

public interface GoodsReceiptService {

    GoodsReceiptResponse createFromPurchaseOrder(UUID companyId, UUID poId, GoodsReceiptRequest request);

    GoodsReceiptResponse updateGoodsReceipt(UUID companyId, UUID grnId, GoodsReceiptRequest request);

    GoodsReceiptResponse getGoodsReceiptById(UUID companyId, UUID grnId);

    Page<GoodsReceiptResponse> getAllGoodsReceipts(UUID companyId, Pageable pageable, GoodsReceiptFilterDto filter);

    List<GoodsReceiptResponse> getGoodsReceiptsByPurchaseOrderId(UUID companyId, UUID poId);

    GoodsReceiptResponse verifyGoodsReceipt(UUID companyId, UUID grnId);

    GoodsReceiptResponse postGoodsReceipt(UUID companyId, UUID grnId);

    GoodsReceiptResponse confirmGoodsReceipt(UUID companyId, UUID grnId);

    GoodsReceiptResponse cancelGoodsReceipt(UUID companyId, UUID grnId, String reason);

    GoodsReceiptResponse reverseGoodsReceipt(UUID companyId, UUID grnId, String reason);

    List<PurchaseOrderResponse> getPendingReceiptsByWarehouse(UUID companyId, UUID warehouseId);

    void deleteGoodsReceipt(UUID companyId, UUID grnId);
}
