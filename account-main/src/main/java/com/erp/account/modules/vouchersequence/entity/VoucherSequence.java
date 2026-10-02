package com.erp.account.modules.vouchersequence.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "voucher_sequence", uniqueConstraints = {
        @UniqueConstraint(name = "uk_voucher_sequence_company_type", columnNames = {"company_id", "voucher_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherSequence extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "voucher_type", nullable = false, length = 100)
    private String voucherType;

    @Column(name = "prefix", nullable = false, length = 20)
    private String prefix;

    @Column(name = "next_number", nullable = false)
    private Long nextNumber;

    @Column(name = "padding_length", nullable = false)
    private Integer paddingLength;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
