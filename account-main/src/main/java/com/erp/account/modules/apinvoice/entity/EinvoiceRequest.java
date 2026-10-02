package com.erp.account.modules.apinvoice.entity;

import com.erp.account.enums.EinvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;


@Entity
@Table(name = "einvoice_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EinvoiceRequest extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_invoice_id", nullable = false)
    private SalesInvoice salesInvoice;

    @Column(name = "irn")
    private String irn;

    @Column(name = "request_payload", columnDefinition = "jsonb")
    private String requestPayload;

    @Column(name = "response_payload", columnDefinition = "jsonb")
    private String responsePayload;

    @Column(name = "ack_number")
    private String ackNumber;

    @Column(name = "ack_date")
    private LocalDateTime ackDate;

    @Column(name = "signed_invoice")
    private String signedInvoice;

    @Column(name = "qr_code_data")
    private String qrCodeData;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EinvoiceStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}


