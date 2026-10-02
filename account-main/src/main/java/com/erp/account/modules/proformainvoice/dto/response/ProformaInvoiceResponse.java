package com.erp.account.modules.proformainvoice.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.proformainvoice.dto.response.profile.PiPaymentSummaryDto;
import com.erp.account.modules.quotation.dto.response.QuotationSummaryDTO;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProformaInvoiceResponse extends BaseResponseDto  implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private String piNumber;
    private LocalDate piDate;
    private LocalDate piValidTill;
    private ProformaInvoiceStatus status;
    private UUID sourceQuotationId;
    private String sourceQuotationNumber;
    private QuotationSummaryDTO quotation;
    private UUID customerId;
    private String customerName;
    private String currency;
    private BigDecimal totalAmount;
    private Boolean advanceRequired;
    private BigDecimal advanceAmount;
    private LocalDateTime createdAt;
    private UUID createdBy;
    private LocalDateTime updatedAt;
    private UUID updatedBy;
    private Boolean isDeleted;
    private PiPaymentSummaryDto paymentSummary;
}
