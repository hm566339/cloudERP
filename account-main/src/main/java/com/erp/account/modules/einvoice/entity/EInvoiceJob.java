package com.erp.account.modules.einvoice.entity;

import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "einvoice_job", uniqueConstraints = {
        @UniqueConstraint(name = "uq_einvoice_job_idempotency", columnNames = {"company_id", "idempotency_key"})
}, indexes = {
        @Index(name = "idx_einvoice_job_invoice", columnList = "invoice_id, created_at"),
        @Index(name = "idx_einvoice_job_status", columnList = "company_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EInvoiceJob extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", insertable = false, updatable = false)
    private SalesInvoice salesInvoice;

    @Column(name = "gst_registration_id", nullable = false)
    private UUID gstRegistrationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gst_registration_id", insertable = false, updatable = false)
    private GstRegistration gstRegistration;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EinvoiceStatus status = EinvoiceStatus.QUEUED;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    @Builder.Default
    private Integer maxRetries = 3;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "irn", length = 64)
    private String irn;

    @Column(name = "ack_number", length = 50)
    private String ackNumber;

    @Column(name = "ack_date")
    private LocalDateTime ackDate;

    @Column(name = "signed_invoice", columnDefinition = "TEXT")
    private String signedInvoice;

    @Column(name = "signed_qr_code", columnDefinition = "TEXT")
    private String signedQrCode;

    @Column(name = "is_mock", nullable = false)
    @Builder.Default
    private Boolean isMock = true;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;
}
