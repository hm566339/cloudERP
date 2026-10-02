package com.erp.account.modules.proformainvoice.service.v2;

import com.erp.account.common.exception.PiNotFoundException;
import com.erp.account.modules.proformainvoice.dto.response.v2.ProformaInvoiceV2Response;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.mapper.ProformaInvoiceV2Mapper;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProformaInvoiceQueryServiceImpl implements ProformaInvoiceQueryService {

    private final ProformaInvoiceRepository proformaInvoiceRepository;
    private final ProformaInvoiceV2Mapper proformaInvoiceV2Mapper;

    @Override
    @Transactional(readOnly = true)
    public ProformaInvoiceV2Response getProformaInvoiceDetails(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ProformaInvoice entity = proformaInvoiceRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new PiNotFoundException(id));

        return proformaInvoiceV2Mapper.toResponse(entity);
    }
}
