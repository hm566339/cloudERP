package com.erp.account.common.dto;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseLocationKey implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID warehouseId;
    private UUID locationId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WarehouseLocationKey that = (WarehouseLocationKey) o;
        return Objects.equals(warehouseId, that.warehouseId) &&
                Objects.equals(locationId, that.locationId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(warehouseId, locationId);
    }

    @Override
    public String toString() {
        return "WarehouseLocationKey{" +
                "warehouseId=" + warehouseId +
                ", locationId=" + locationId +
                '}';
    }
}
