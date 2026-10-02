package com.erp.account.modules.salesorder.mapper;

import com.erp.account.modules.auditlog.dto.AuditMapper;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import org.springframework.stereotype.Component;

@Component
public class SalesOrderMapper {

    public SalesOrderResponse toResponse(SalesOrder so) {
        if (so == null) {
            return null;
        }

        SalesOrderResponse response = SalesOrderResponse.builder()
                .id(so.getId())
                .soNumber(so.getSoNumber())
                .soDate(so.getSoDate())
                .status(so.getStatus())
                .sourceProformaInvoiceId(so.getSourceProformaInvoiceId())
                .sourceProformaInvoiceNumber(so.getSourceProformaInvoiceNumber())
                .sourceQuotationId(so.getSourceQuotationId())
                .sourceQuotationNumber(so.getSourceQuotationNumber())
                .customerId(so.getCustomerId())
                .customerName(so.getCustomer() != null ? so.getCustomer().getCustomerName() : null)
                .currency(so.getCurrency())
                .totalAmount(so.getTotalAmount())
                .createdAt(so.getCreatedAt())
                .createdBy(so.getCreatedBy())
                .build();

        AuditMapper.attachAudit(so, response);
        return response;
    }
}
