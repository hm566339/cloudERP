package com.erp.account.modules.proformainvoice.service;

import com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
import com.erp.account.modules.proformainvoice.dto.request.ProformaInvoiceDirectCreateRequest;
import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceResponse;
import com.erp.account.modules.proformainvoice.dto.response.profile.ProformaInvoiceProfileResponse;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;

import java.util.UUID;

public interface ProformaInvoiceService {

    ProformaInvoiceResponse createFromQuotation(UUID companyId, UUID quotationId, PIConversionRequest request);

    ProformaInvoiceResponse createDirectProformaInvoice(UUID companyId, ProformaInvoiceDirectCreateRequest request);

    ProformaInvoiceProfileResponse getProformaInvoiceById(UUID companyId, UUID id);

    ProformaInvoiceResponse changeStatus(UUID companyId, UUID id, ProformaInvoiceStatus newStatus);

    ProformaInvoiceResponse sendPI(UUID companyId, UUID id);

    ProformaInvoiceResponse confirmPI(UUID companyId, UUID id);

    ProformaInvoiceResponse cancelPI(UUID companyId, UUID id);

    org.springframework.data.domain.Page<ProformaInvoiceResponse> getAllProformaInvoices(UUID companyId,
            com.erp.account.modules.proformainvoice.dto.request.PIFilterDto filter,
            org.springframework.data.domain.Pageable pageable);

    ProformaInvoiceProfileResponse getProformaInvoiceByNumber(UUID companyId, String piNumber);

    ProformaInvoiceResponse updateProformaInvoice(UUID companyId, UUID id,
            com.erp.account.modules.proformainvoice.dto.request.PIUpdateRequest request);

    void deleteProformaInvoice(UUID companyId, UUID id);
}
