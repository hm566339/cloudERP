package com.erp.account.modules.invoicetax.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxRequest;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxResponse;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxFilterDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;


public interface InvoiceTaxService {

    InvoiceTaxResponse createInvoiceTax(UUID invoiceId, RequestWrapper<InvoiceTaxRequest> request, UUID companyId);

    InvoiceTaxResponse updateInvoiceTax(UUID invoiceId, UUID taxId, RequestWrapper<InvoiceTaxRequest> request, UUID companyId);

    void deleteInvoiceTax(UUID invoiceId, UUID taxId, UUID companyId);

    InvoiceTaxResponse getInvoiceTax(UUID invoiceId, UUID taxId, UUID companyId);

    Page<InvoiceTaxResponse> getInvoiceTaxes(UUID invoiceId, InvoiceTaxFilterDto filter, Pageable pageable);
}
