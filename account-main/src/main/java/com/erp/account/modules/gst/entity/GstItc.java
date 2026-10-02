package com.erp.account.modules.gst.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gst_itc")
public class GstItc extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "branch_id")
    private UUID branchId;
    
    @Column(name = "financial_year", length = 10)
    private String financialYear;
    
    @Column(name = "month")
    private int month;

    @Column(name = "eligible_cgst", precision = 19, scale = 4)
    private BigDecimal eligibleCgst;

    @Column(name = "eligible_sgst", precision = 19, scale = 4)
    private BigDecimal eligibleSgst;

    @Column(name = "eligible_igst", precision = 19, scale = 4)
    private BigDecimal eligibleIgst;

    @Column(name = "eligible_cess", precision = 19, scale = 4)
    private BigDecimal eligibleCess;

    @Column(name = "blocked_itc_cgst", precision = 19, scale = 4)
    private BigDecimal blockedItcCgst;

    @Column(name = "blocked_itc_sgst", precision = 19, scale = 4)
    private BigDecimal blockedItcSgst;

    @Column(name = "blocked_itc_igst", precision = 19, scale = 4)
    private BigDecimal blockedItcIgst;

    @Column(name = "reversed_itc", precision = 19, scale = 4)
    private BigDecimal reversedItc;

    @Column(name = "utilized_itc_cgst", precision = 19, scale = 4)
    private BigDecimal utilizedItcCgst;
    
    @Column(name = "utilized_itc_sgst", precision = 19, scale = 4)
    private BigDecimal utilizedItcSgst;
    
    @Column(name = "utilized_itc_igst", precision = 19, scale = 4)
    private BigDecimal utilizedItcIgst;

    @Column(name = "balance_cgst", precision = 19, scale = 4)
    private BigDecimal balanceCgst;
    
    @Column(name = "balance_sgst", precision = 19, scale = 4)
    private BigDecimal balanceSgst;
    
    @Column(name = "balance_igst", precision = 19, scale = 4)
    private BigDecimal balanceIgst;
}
