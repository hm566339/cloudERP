package com.erp.auth_service.dto.subscription;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayCheckoutResponse {

    private String keyId;

    /** Razorpay order ID (order_xxxxx) for one-time payment Checkout */
    private String orderId;

    /** Total amount in integer paise (e.g. 299900 for 2999.00 INR) */
    private Long amountInPaise;

    /** Legacy / fallback identifier for backward compatibility */
    private String subscriptionId;

    /** ERP internal subscription UUID — used for status polling and cancellation */
    private UUID erpSubscriptionId;

    private String planName;
    private String planCode;

    /** Price at subscription time — immutable, fetched from DB not frontend */
    private BigDecimal amount;

    private String currency;
    private UUID organizationId;
    private String organizationName;
}
