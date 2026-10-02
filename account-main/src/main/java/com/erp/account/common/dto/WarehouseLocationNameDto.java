package com.erp.account.common.dto;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseLocationNameDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private String warehouseName;
    private String locationName;
}
