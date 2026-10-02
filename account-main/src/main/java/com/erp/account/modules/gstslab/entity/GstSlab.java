package com.erp.account.modules.gstslab.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;

import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;


@Entity
@Table(name = "gst_slab")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstSlab extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;



    @Column(name = "slab_name")
    private String slabName;

    @Column(name = "cgst_rate", precision = 5, scale = 2)
    private BigDecimal cgstRate;

    @Column(name = "sgst_rate", precision = 5, scale = 2)
    private BigDecimal sgstRate;

    @Column(name = "igst_rate", precision = 5, scale = 2)
    private BigDecimal igstRate;

    @Column(name = "cess_rate", precision = 5, scale = 2)
    private BigDecimal cessRate;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @OneToMany(mappedBy = "gstSlab", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<HsnSacMaster> hsnSacMasters;

    @OneToMany(mappedBy = "gstSlab", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<InvoiceTax> invoiceTaxes;
}


