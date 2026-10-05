package com.erp.auth_service.dto.subscription;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionCheckoutRequest {

    @NotBlank(message = "Plan identifier (id or code) is required")
    private String planId;

    @Builder.Default
    private Integer totalCount = 12;

    @Builder.Default
    private Integer customerNotify = 1;
}
