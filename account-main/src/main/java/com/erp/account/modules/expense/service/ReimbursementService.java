package com.erp.account.modules.expense.service;

import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.expense.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReimbursementService {
    ReimbursementResponse createReimbursement(UUID companyId, ReimbursementCreateRequest request);
    ReimbursementResponse getReimbursementById(UUID companyId, UUID id);
    Page<ReimbursementResponse> getAllReimbursements(UUID companyId, ReimbursementFilterRequest filter, Pageable pageable);
    ReimbursementResponse updateReimbursement(UUID companyId, UUID id, ReimbursementUpdateRequest request);
    PostResponse deleteReimbursement(UUID companyId, UUID id);
    
    ReimbursementResponse submitReimbursement(UUID companyId, UUID id);
    ReimbursementResponse approveReimbursement(UUID companyId, UUID id, ReimbursementApproveRequest request);
    ReimbursementResponse rejectReimbursement(UUID companyId, UUID id, ReimbursementRejectRequest request);
    ReimbursementResponse payReimbursement(UUID companyId, UUID id, ReimbursementPayRequest request);
    ReimbursementResponse cancelReimbursement(UUID companyId, UUID id);
}
