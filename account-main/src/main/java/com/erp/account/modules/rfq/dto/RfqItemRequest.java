package com.erp.account.modules.rfq.dto;
import com.erp.account.enums.ItemType;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RfqItemRequest { private UUID itemId; @NotBlank private String itemName; private String description; private ItemType itemType; @NotNull @DecimalMin("0.0001") private BigDecimal quantity; private String unit; private LocalDate requiredDate; private String specifications; }
