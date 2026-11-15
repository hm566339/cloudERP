package com.erp.crm.modules.account.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.account.enums.AddressType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.util.UUID;

@Entity
@Table(name = "crm_address")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmAddress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Enumerated(EnumType.STRING)
        @Column(name = "address_type", nullable = false)
    @Builder.Default
    private AddressType addressType = AddressType.BILLING;

    @Column(name = "address_line1", nullable = false, length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "state_code", nullable = false, length = 10)
    private String stateCode;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Builder.Default
    @Column(name = "country", nullable = false, length = 100)
    private String country = "India";

    @Column(name = "gstin_for_address", length = 15)
    private String gstinForAddress;

    @Builder.Default
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
