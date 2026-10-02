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
@Table(name = "gst_tax_summary")
public class GstTaxSummary extends BaseEntity {

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

    // OUTPUT TAX
    @Column(name = "total_output_cgst", precision = 19, scale = 4)
    private BigDecimal totalOutputCgst;

    @Column(name = "total_output_sgst", precision = 19, scale = 4)
    private BigDecimal totalOutputSgst;

    @Column(name = "total_output_igst", precision = 19, scale = 4)
    private BigDecimal totalOutputIgst;

    @Column(name = "total_output_cess", precision = 19, scale = 4)
    private BigDecimal totalOutputCess;

    // NET LIABILITY
    @Column(name = "net_payable_cgst", precision = 19, scale = 4)
    private BigDecimal netPayableCgst;

    @Column(name = "net_payable_sgst", precision = 19, scale = 4)
    private BigDecimal netPayableSgst;

    @Column(name = "net_payable_igst", precision = 19, scale = 4)
    private BigDecimal netPayableIgst;

    @Column(name = "total_net_payable", precision = 19, scale = 4)
    private BigDecimal totalNetPayable;
    
    @Column(name = "status", length = 50)
    private String status; // DRAFT, FILED, PAID
}
