package com.erp.crm.modules.quotation.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConvertToSalesOrderResponse {

    private UUID quotationId;
    private String quotationNumber;
    private UUID salesOrderId;
    private String salesOrderNumber;
    private String status;
}

