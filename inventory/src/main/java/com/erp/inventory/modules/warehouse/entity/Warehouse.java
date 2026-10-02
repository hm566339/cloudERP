package com.erp.inventory.modules.warehouse.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.warehouse.enums.WarehouseType;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Table(name = "warehouse", uniqueConstraints = {
    @UniqueConstraint(name = "uk_company_warehouse_code", columnNames = {"company_id", "warehouse_code"})
}, indexes = {
    @Index(name = "idx_warehouse_company", columnList = "company_id")
})
public class Warehouse extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "warehouse_code", length = 50, nullable = false)
    private String warehouseCode;

    @Column(name = "warehouse_name", length = 150, nullable = false)
    private String warehouseName;

    @Enumerated(EnumType.STRING)
    @Column(name = "warehouse_type", length = 50)
    private WarehouseType warehouseType;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "pin_code", length = 20)
    private String pinCode;

    @Column(name = "status", length = 50, nullable = false)
    private String status;

    @Builder.Default
    @OneToMany(mappedBy = "warehouse", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WarehouseLocation> locations = new ArrayList<>();

    public void addLocation(WarehouseLocation location) {
        locations.add(location);
        location.setWarehouse(this);
    }

    public void removeLocation(WarehouseLocation location) {
        locations.remove(location);
        location.setWarehouse(null);
    }
}
