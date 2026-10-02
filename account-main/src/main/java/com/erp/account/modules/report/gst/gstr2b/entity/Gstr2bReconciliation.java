package com.erp.account.modules.report.gst.gstr2b.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gstr2b_reconciliation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gstr2bReconciliation extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "supplier_gstin", nullable = false)
    private String supplierGstin;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "taxable_value", precision = 19, scale = 4)
    private BigDecimal taxableValue;

    @Column(name = "tax_amount", precision = 19, scale = 4)
    private BigDecimal taxAmount;

    @Column(name = "match_status")
    private String matchStatus; // MATCHED, MISMATCHED_AMOUNT, MISSING_IN_BOOKS, MISSING_IN_2B

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "reconciliation_date")
    private LocalDateTime reconciliationDate;

    @Column(name = "reconciled_by")
    private String reconciledBy;
}
