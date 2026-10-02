package com.erp.account.modules.rfq.dto;

import com.erp.account.modules.rfq.entity.RfqStatus;
import lombok.*;
import java.time.*;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RfqResponse {
    private UUID id;
    private UUID companyId;
    private String rfqNumber;
    private UUID purchaseRequisitionId;
    private LocalDate issueDate;
    private LocalDate quotationDeadline;
    private LocalDate expectedDeliveryDate;
    private String terms;
    private String notes;
    private RfqStatus status;
    private List<Item> items;
    private List<Vendor> vendors;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private UUID id;
        private UUID itemId;
        private String itemName;
        private String description;
        private java.math.BigDecimal quantity;
        private String unit;
        private LocalDate requiredDate;
        private String specifications;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Vendor {
        private UUID id;
        private UUID vendorId;
        private RfqVendorStatus status;
        private LocalDateTime invitedAt;
        private LocalDateTime responseDate;
        private String remarks;
        private String vendorName;
    }

    public enum RfqVendorStatus {
        INVITED, RESPONDED, DECLINED
    }
}
