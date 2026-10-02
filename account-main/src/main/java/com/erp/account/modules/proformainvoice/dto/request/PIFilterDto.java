package com.erp.account.modules.proformainvoice.dto.request;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class PIFilterDto {
    private String piNumber;
    private UUID customerId;
    private ProformaInvoiceStatus status;
    private UUID sourceQuotationId;
    private String search;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;
}
