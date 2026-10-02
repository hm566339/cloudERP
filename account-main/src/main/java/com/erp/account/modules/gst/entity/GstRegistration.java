package com.erp.account.modules.gst.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.gst.enums.GstRegistrationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gst_registration")
public class GstRegistration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "gstin", length = 15)
    private String gstin;

    @Column(name = "pan", length = 10)
    private String pan;

    @Enumerated(EnumType.STRING)
    @Column(name = "registration_type", nullable = false)
    private GstRegistrationType registrationType;

    @Column(name = "registered_date")
    private LocalDate registeredDate;

    @Column(name = "legal_name", length = 255)
    private String legalName;

    @Column(name = "trade_name", length = 255)
    private String tradeName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "state_code_id")
    private GstStateCode stateCode;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;
}
