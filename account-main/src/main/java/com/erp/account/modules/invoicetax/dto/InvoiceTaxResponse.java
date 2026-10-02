package com.erp.account.modules.invoicetax.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceTaxResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID companyId;
    private UUID salesInvoiceId;
    private String salesInvoiceNumber;
    private UUID gstSlabId;
    private String gstSlabName;
    private BigDecimal taxableAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private UUID updatedBy;
    private LocalDateTime updatedAt;
    private Boolean isDeleted;
}
