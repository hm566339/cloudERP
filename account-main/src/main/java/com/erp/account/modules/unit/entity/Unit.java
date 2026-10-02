package com.erp.account.modules.unit.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "unit_master", indexes = {
    @Index(name = "idx_unit_code", columnList = "code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "symbol", length = 20)
    private String symbol;

    @Column(name = "allow_decimal", nullable = false)
    @Builder.Default
    private boolean allowDecimal = true;

    @Column(name = "decimal_places")
    @Builder.Default
    private Integer decimalPlaces = 2;
}
