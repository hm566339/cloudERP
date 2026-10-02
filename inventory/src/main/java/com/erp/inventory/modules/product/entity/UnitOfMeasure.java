package com.erp.inventory.modules.product.entity;

import com.erp.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "unit_of_measure")
public class UnitOfMeasure extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "code")
    private String code;

    @Column(name = "name")
    private String name;

    @Column(name = "decimal_places")
    private Integer decimalPlaces;

    @Column(name = "is_active")
    private Boolean isActive;

}
