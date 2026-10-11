package com.erp.auth_service.dto.subscription;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderDto {
    private String id;
    private String entity;
    private Long amount; // in paise
    private Long amountPaid;
    private Long amountDue;
    private String currency;
    private String receipt;
    private String status;
    private Integer attempts;
    private Map<String, String> notes;
    private Long createdAt;
}
