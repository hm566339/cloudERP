package com.erp.auth_service.dto.subscription;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVerificationRequest {

    private String orderId;

    private String paymentId;

    private String signature;
}
