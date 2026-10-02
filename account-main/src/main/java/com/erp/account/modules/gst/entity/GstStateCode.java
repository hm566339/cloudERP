package com.erp.account.modules.gst.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.common.entity.Country;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gst_state_code")
public class GstStateCode extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "state_code", nullable = false, unique = true, length = 2)
    private String stateCode;

    @Column(name = "state_name", nullable = false, length = 100)
    private String stateName;

    @Column(name = "is_union_territory", nullable = false)
    private boolean isUnionTerritory;

    // New Fields added for Master Profile
    @Column(name = "short_name", length = 10)
    private String shortName;

    @Column(name = "iso_state_code", length = 10)
    private String isoStateCode;

    @Column(name = "capital_city", length = 100)
    private String capitalCity;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "time_zone", length = 50)
    private String timeZone;

    @Column(name = "currency_code", length = 3)
    private String currencyCode;

    @Column(name = "currency_name", length = 50)
    private String currencyName;

    @Column(name = "registration_allowed")
    private Boolean registrationAllowed;

    @Column(name = "default_place_of_supply", length = 100)
    private String defaultPlaceOfSupply;

    @Column(name = "reverse_charge_applicable")
    private Boolean reverseChargeApplicable;

    @Column(name = "display_name", length = 150)
    private String displayName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id")
    private Country country;
}
