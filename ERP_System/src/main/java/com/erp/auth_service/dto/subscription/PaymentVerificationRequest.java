package com.erp.auth_service.dto.subscription;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVerificationRequest {

    @NotBlank(message = "Razorpay order ID is required")
    private String orderId;

    @NotBlank(message = "Razorpay payment ID is required")
    private String paymentId;

    @NotBlank(message = "Razorpay signature is required")
    private String signature;
}
