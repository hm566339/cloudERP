package com.erp.account.modules.deliverychallan.service;

import com.erp.account.modules.deliverychallan.dto.request.DcConversionRequest;
import com.erp.account.modules.deliverychallan.dto.request.DcFromReceiptRequest;
import com.erp.account.modules.deliverychallan.dto.request.DeliveryChallanUpdateRequest;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanProfileResponse;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface DeliveryChallanService {

    Page<DeliveryChallanProfileResponse> getAllDeliveryChallans(UUID companyId, Pageable pageable,
            DeliveryChallanStatus status, UUID customerId, LocalDate fromDate, LocalDate toDate, String search);

    DeliveryChallanResponse getDeliveryChallanById(UUID companyId, UUID id);

    DeliveryChallanResponse createFromSalesOrder(UUID companyId, DcConversionRequest request);

    DeliveryChallanResponse createFromReceipt(UUID companyId, UUID receiptId, DcFromReceiptRequest request);

    DeliveryChallanResponse updateDeliveryChallan(UUID companyId, UUID id, DeliveryChallanUpdateRequest request);

    void confirmDeliveryChallan(UUID companyId, UUID id);

    void cancelDeliveryChallan(UUID companyId, UUID id);

    com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse generateInvoiceFromDeliveryChallan(UUID companyId, UUID deliveryChallanId);
}
