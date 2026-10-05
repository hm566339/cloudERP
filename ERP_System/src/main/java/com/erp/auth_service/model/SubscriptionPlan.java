package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "subscription_plan",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_subscription_plan_code", columnNames = "code")
    },
    indexes = {
        @Index(name = "idx_subscription_plan_active", columnList = "active"),
        @Index(name = "idx_subscription_plan_is_trial", columnList = "is_trial"),
        @Index(name = "idx_subscription_plan_razorpay", columnList = "razorpay_plan_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 80, unique = true)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "duration_days", nullable = false)
    @Builder.Default
    private Integer durationDays = 30;

    @Column(name = "max_users")
    private Integer maxUsers;

    @Column(name = "max_companies")
    private Integer maxCompanies;

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "is_trial", nullable = false)
    @Builder.Default
    private Boolean isTrial = false;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubscriptionPlanModule> planModules = new ArrayList<>();

    /**
     * Razorpay Plan ID linked to this ERP plan + price combination.
     * IMPORTANT: If the price is changed, this field MUST be cleared so a new
     * Razorpay Plan is created for new subscribers. Existing subscriptions retain
     * their original priceAtSubscription value and are unaffected.
     */
    @Column(name = "razorpay_plan_id", length = 100)
    private String razorpayPlanId;

    /**
     * Optional version label for audit purposes (e.g. "v1", "v2").
     * Populated automatically when razorpayPlanId is regenerated.
     */
    @Column(name = "plan_version", length = 50)
    @Builder.Default
    private String planVersion = "v1";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
