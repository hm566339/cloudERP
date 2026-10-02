package com.erp.account.modules.rfq.dto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RfqRequest { @NotNull private UUID purchaseRequisitionId; private LocalDate issueDate; private LocalDate quotationDeadline; private LocalDate expectedDeliveryDate; private String terms; private String notes; @Valid @NotEmpty private List<RfqItemRequest> items; @NotEmpty private List<UUID> vendorIds; }
