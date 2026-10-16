package com.erp.account.modules.receiptvoucher.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherFilterDto;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
import com.erp.account.modules.receiptvoucher.dto.response.profile.ReceiptVoucherProfileResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReceiptVoucherService {
    ReceiptVoucherResponse createReceipt(UUID companyId, RequestWrapper<ReceiptVoucherRequest> req);

    ReceiptVoucherResponse updateReceipt(UUID id, RequestWrapper<ReceiptVoucherRequest> req);

    ReceiptVoucherResponse getReceiptById(UUID companyId, UUID id);

    ReceiptVoucherProfileResponse getReceiptProfile(UUID companyId, UUID id);

    Page<ReceiptVoucherResponse> getReceipts(ReceiptVoucherFilterDto filter, Pageable pageable);

    void deleteReceipt(UUID companyId, UUID id);

    void submitForApproval(UUID id);

    void submitForApproval(UUID id, String comments);

    void approveReceipt(UUID id);

    void rejectReceipt(UUID id);

    void postReceipt(UUID id);

    void reverseReceipt(UUID id);

    void cancelReceipt(UUID id);
}

