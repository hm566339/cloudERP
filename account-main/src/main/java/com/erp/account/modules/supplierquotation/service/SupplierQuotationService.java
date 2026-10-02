package com.erp.account.modules.supplierquotation.service;

import com.erp.account.modules.supplierquotation.dto.*;
import org.springframework.data.domain.*;
import java.util.*;

public interface SupplierQuotationService {
    SupplierQuotationResponse create(UUID companyId, SupplierQuotationRequest request);

    SupplierQuotationResponse get(UUID companyId, UUID id);

    Page<SupplierQuotationResponse> list(UUID companyId, Pageable pageable);

    List<SupplierQuotationResponse> compareByRfq(UUID companyId, UUID rfqId);

    SupplierQuotationResponse award(UUID companyId, UUID id);
}
