package com.erp.auth_service.model;

import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "subscription",
    indexes = {
        @Index(name = "idx_subscription_org_status", columnList = "organization_id,status"),
        @Index(name = "idx_subscription_razorpay_sub_id", columnList = "razorpay_subscription_id"),
        @Index(name = "idx_subscription_razorpay_plan_id", columnList = "razorpay_plan_id"),
        @Index(name = "idx_subscription_razorpay_order_id", columnList = "razorpay_order_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan plan;

    @Column(name = "plan_code", nullable = false, length = 80)
    @Builder.Default
    private String planCode = "TRIAL";

    @Column(precision = 19, scale = 4)
    private BigDecimal price;

    @Column(length = 3)
    @Builder.Default
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.TRIALING;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_mode", nullable = false, length = 30)
    @Builder.Default
    private AccessMode accessMode = AccessMode.FULL;

    @Column(name = "trial_started_at")
    private LocalDateTime trialStartedAt;

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt;

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "razorpay_plan_id", length = 100)
    private String razorpayPlanId;

    @Column(name = "razorpay_subscription_id", length = 100)
    private String razorpaySubscriptionId;

    @Column(name = "razorpay_customer_id", length = 100)
    private String razorpayCustomerId;

    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    @Column(name = "next_billing_date")
    private LocalDateTime nextBillingDate;

    /**
     * Captures the price at the time of subscription checkout.
     * This is IMMUTABLE after subscription creation — plan price changes must not
     * affect existing subscribers.
     */
    @Column(name = "price_at_subscription", precision = 19, scale = 4)
    private java.math.BigDecimal priceAtSubscription;

    /**
     * Captures the plan version code at subscription time (e.g. "PRO-v1").
     * Allows tracking which pricing generation is in use.
     */
    @Column(name = "plan_version_code", length = 120)
    private String planVersionCode;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LocalDateTime getStartDate() {
        return currentPeriodStart != null ? currentPeriodStart : trialStartedAt;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.currentPeriodStart = startDate;
    }

    public LocalDateTime getEndDate() {
        return currentPeriodEnd != null ? currentPeriodEnd : trialEndsAt;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.currentPeriodEnd = endDate;
    }
}
