package com.erp.account.modules.report.gst.ecl.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "electronic_credit_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicCreditLedger extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "gst_registration_id")
    private UUID gstRegistrationId;

    @Column(name = "financial_year_id", nullable = false)
    private UUID financialYearId;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "year", nullable = false)
    private Integer year;

    // Opening Balances
    @Column(name = "opening_igst", precision = 19, scale = 4)
    private BigDecimal openingIgst = BigDecimal.ZERO;
    @Column(name = "opening_cgst", precision = 19, scale = 4)
    private BigDecimal openingCgst = BigDecimal.ZERO;
    @Column(name = "opening_sgst", precision = 19, scale = 4)
    private BigDecimal openingSgst = BigDecimal.ZERO;
    @Column(name = "opening_cess", precision = 19, scale = 4)
    private BigDecimal openingCess = BigDecimal.ZERO;

    // Monthly Credits (from GSTR-2B matching)
    @Column(name = "credit_igst", precision = 19, scale = 4)
    private BigDecimal creditIgst = BigDecimal.ZERO;
    @Column(name = "credit_cgst", precision = 19, scale = 4)
    private BigDecimal creditCgst = BigDecimal.ZERO;
    @Column(name = "credit_sgst", precision = 19, scale = 4)
    private BigDecimal creditSgst = BigDecimal.ZERO;
    @Column(name = "credit_cess", precision = 19, scale = 4)
    private BigDecimal creditCess = BigDecimal.ZERO;

    // Monthly Utilized (against GSTR-3B liability)
    @Column(name = "utilized_igst", precision = 19, scale = 4)
    private BigDecimal utilizedIgst = BigDecimal.ZERO;
    @Column(name = "utilized_cgst", precision = 19, scale = 4)
    private BigDecimal utilizedCgst = BigDecimal.ZERO;
    @Column(name = "utilized_sgst", precision = 19, scale = 4)
    private BigDecimal utilizedSgst = BigDecimal.ZERO;
    @Column(name = "utilized_cess", precision = 19, scale = 4)
    private BigDecimal utilizedCess = BigDecimal.ZERO;

    // Closing Balances
    @Column(name = "closing_igst", precision = 19, scale = 4)
    private BigDecimal closingIgst = BigDecimal.ZERO;
    @Column(name = "closing_cgst", precision = 19, scale = 4)
    private BigDecimal closingCgst = BigDecimal.ZERO;
    @Column(name = "closing_sgst", precision = 19, scale = 4)
    private BigDecimal closingSgst = BigDecimal.ZERO;
    @Column(name = "closing_cess", precision = 19, scale = 4)
    private BigDecimal closingCess = BigDecimal.ZERO;

}
