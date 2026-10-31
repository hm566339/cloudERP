package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "organization_regional_settings",
        uniqueConstraints = @UniqueConstraint(name = "uk_org_regional_settings_org", columnNames = {"organization_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRegionalSettings {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false, unique = true)
    private Organization organization;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "timezone", nullable = false, length = 80)
    @Builder.Default
    private String timezone = "Asia/Kolkata (IST)";

    @Column(name = "fiscal_year_start_month", nullable = false, length = 30)
    @Builder.Default
    private String fiscalYearStartMonth = "April";

    @Column(name = "date_format", nullable = false, length = 20)
    @Builder.Default
    private String dateFormat = "DD/MM/YYYY";

    @Column(name = "time_format", nullable = false, length = 20)
    @Builder.Default
    private String timeFormat = "12h";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

