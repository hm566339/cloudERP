package com.erp.account.modules.ledger.entity;

// TODO: Move TaxTransaction to a dedicated tax/GST module in a future migration.
// Keeping the package stable avoids breaking existing imports and persistence wiring.

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;


@Entity
@Table(name = "tax_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxTransaction extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "source_type")
    private String sourceType;

    @Column(name = "source_id")
    private UUID sourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hsn_sac_id")
    private HsnSacMaster hsnSacMaster;

    @Column(name = "taxable_amount", precision = 19, scale = 4)
    private BigDecimal taxableAmount;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}


