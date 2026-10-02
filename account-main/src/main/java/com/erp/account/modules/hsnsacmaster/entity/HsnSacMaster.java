package com.erp.account.modules.hsnsacmaster.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;

import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.ledger.entity.TaxTransaction;


@Entity
@Table(name = "hsn_sac_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HsnSacMaster extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;





    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "type", nullable = false)
    private String type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gst_slab_id", nullable = false)
    private GstSlab gstSlab;

    @OneToMany(mappedBy = "hsnSacMaster", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TaxTransaction> taxTransactions;

    @OneToMany(mappedBy = "hsnSacMaster", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<SalesInvoiceItem> salesInvoiceItems;
}


