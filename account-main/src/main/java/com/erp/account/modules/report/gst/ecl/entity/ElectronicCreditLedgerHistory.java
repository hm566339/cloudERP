package com.erp.account.modules.report.gst.ecl.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "electronic_credit_ledger_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicCreditLedgerHistory extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "electronic_credit_ledger_id", nullable = false)
    private ElectronicCreditLedger electronicCreditLedger;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // CREDIT, DEBIT

    @Column(name = "reference_number")
    private String referenceNumber; // GSTR-3B ref or Invoice ref

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount = BigDecimal.ZERO;
    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount = BigDecimal.ZERO;

    @Column(name = "remarks")
    private String remarks;

}
