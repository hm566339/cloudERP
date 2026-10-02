package com.erp.account.modules.rfq.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "rfq_vendor", uniqueConstraints = @UniqueConstraint(name = "uk_rfq_vendor", columnNames = {"rfq_id", "vendor_id"}), indexes = { @Index(name = "idx_rfqv_company", columnList = "company_id"), @Index(name = "idx_rfqv_vendor", columnList = "vendor_id") })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RfqVendor extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "company_id", nullable = false, updatable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "rfq_id", nullable = false) private Rfq rfq;
    @Column(name = "vendor_id", nullable = false) private UUID vendorId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private com.erp.account.modules.vendor.entity.Vendor vendor;
    @Column(name = "invited_at", nullable = false) @Builder.Default private LocalDateTime invitedAt = LocalDateTime.now();
    @Enumerated(EnumType.STRING) @Column(name = "response_status", nullable = false, length = 20) @Builder.Default private RfqVendorResponseStatus responseStatus = RfqVendorResponseStatus.INVITED;
    @Column(name = "response_date") private LocalDateTime responseDate;
    @Column(name = "remarks", columnDefinition = "TEXT") private String remarks;
}
