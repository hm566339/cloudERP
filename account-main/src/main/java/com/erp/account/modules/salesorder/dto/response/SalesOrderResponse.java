package com.erp.account.modules.salesorder.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
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
public class SalesOrderResponse extends BaseResponseDto  implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private String soNumber;
    private LocalDate soDate;
    private SalesOrderStatus status;
    private UUID sourceProformaInvoiceId;
    private String sourceProformaInvoiceNumber;
    private UUID sourceQuotationId;
    private String sourceQuotationNumber;
    private UUID customerId;
    private String customerName;
    private String currency;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private UUID createdBy;
}
