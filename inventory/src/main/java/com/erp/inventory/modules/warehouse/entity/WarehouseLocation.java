package com.erp.inventory.modules.warehouse.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.warehouse.enums.LocationType;
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
@Table(name = "warehouse_location", uniqueConstraints = {
    @UniqueConstraint(name = "uk_company_wh_loc_code", columnNames = {"company_id", "warehouse_id", "location_code"})
}, indexes = {
    @Index(name = "idx_wh_loc_parent", columnList = "company_id, parent_location_id"),
    @Index(name = "idx_wh_loc_type", columnList = "company_id, warehouse_id, location_type")
})
public class WarehouseLocation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    @ToString.Exclude
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_location_id")
    @ToString.Exclude
    private WarehouseLocation parentLocation;

    @Builder.Default
    @OneToMany(mappedBy = "parentLocation", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<WarehouseLocation> subLocations = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 50, nullable = false)
    private LocationType locationType;

    @Column(name = "location_code", length = 50, nullable = false)
    private String locationCode;

    @Column(name = "location_name", length = 150, nullable = false)
    private String locationName;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public void addSubLocation(WarehouseLocation subLocation) {
        subLocations.add(subLocation);
        subLocation.setParentLocation(this);
    }

    // Convenience methods to avoid breaking existing service and mapping code
    public UUID getWarehouseId() {
        return warehouse != null ? warehouse.getId() : null;
    }

    public void setWarehouseId(UUID warehouseId) {
        if (warehouseId == null) {
            this.warehouse = null;
            return;
        }
        if (this.warehouse == null) {
            this.warehouse = new Warehouse();
        }
        this.warehouse.setId(warehouseId);
    }

    public UUID getParentLocationId() {
        return parentLocation != null ? parentLocation.getId() : null;
    }

    public void setParentLocationId(UUID parentLocationId) {
        if (parentLocationId == null) {
            this.parentLocation = null;
            return;
        }
        if (this.parentLocation == null) {
            this.parentLocation = new WarehouseLocation();
        }
        this.parentLocation.setId(parentLocationId);
    }

    @PrePersist
    @PreUpdate
    private void validateHierarchy() {
        if (this.parentLocation != null && this.id != null && this.id.equals(this.parentLocation.getId())) {
            throw new IllegalStateException("A warehouse location cannot be its own parent.");
        }
    }
}
