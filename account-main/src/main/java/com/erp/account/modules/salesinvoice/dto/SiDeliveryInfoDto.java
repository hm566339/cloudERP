package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiDeliveryInfoDto {
    private String deliveryChallan;
    private LocalDate dispatchDate;
    private String transporter;
    private String vehicleNumber;
    private String lrNumber;
    private String trackingNumber;

    // Delivery Address Snapshot
    private UUID deliveryAddressId;
    private String deliveryAddressLine1;
    private String deliveryAddressLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryCountry;
    private String deliveryPostalCode;
}
