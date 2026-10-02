package com.erp.account.modules.proformainvoice.service.v2;

import com.erp.account.modules.proformainvoice.dto.response.v2.ProformaInvoiceV2Response;

import java.util.UUID;

public interface ProformaInvoiceQueryService {
    ProformaInvoiceV2Response getProformaInvoiceDetails(UUID companyId, UUID id);
}
