package com.erp.account.modules.purchaserequisition.service;

import com.erp.account.modules.purchaserequisition.dto.*;
import org.springframework.data.domain.*;
import java.util.UUID;

public interface PurchaseRequisitionService {
    PurchaseRequisitionResponse create(UUID companyId, PurchaseRequisitionRequest request);
    PurchaseRequisitionResponse update(UUID companyId, UUID id, PurchaseRequisitionRequest request);
    PurchaseRequisitionResponse get(UUID companyId, UUID id);
    Page<PurchaseRequisitionResponse> list(UUID companyId, Pageable pageable);
    PurchaseRequisitionResponse submit(UUID companyId, UUID id);
    PurchaseRequisitionResponse approve(UUID companyId, UUID id);
    PurchaseRequisitionResponse reject(UUID companyId, UUID id, String reason);
    PurchaseRequisitionResponse cancel(UUID companyId, UUID id);
}
