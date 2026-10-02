package com.erp.account.modules.quotation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.customer.dto.request.CustomerAddressRequest;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for updating a Quotation")
public class QuotationUpdateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Customer ID is mandatory")
    private UUID customerId;

    private UUID deliveryAddressId;

    @Valid
    private CustomerAddressRequest newDeliveryAddress;

    private Boolean saveNewDeliveryAddress;

    @Size(max = 50, message = "Quotation number must be up to 50 characters")
    @Schema(description = "Unique quotation number per company. Cannot be directly updated by frontend.", accessMode = Schema.AccessMode.READ_ONLY)
    private String quotationNumber;

    @NotNull(message = "Quotation date is mandatory")
    @PastOrPresent(message = "Quotation date cannot be in the future")
    private LocalDate quotationDate;

    @NotNull(message = "Valid until date is mandatory")
    private LocalDate validUntil;

    @Size(max = 100)
    private String referenceNumber;

    @Size(min = 3, max = 3)
    private String quotationCurrency;

    @DecimalMin(value = "0.000001")
    private BigDecimal exchangeRate;

    @PositiveOrZero
    private BigDecimal freightCharges;

    @PositiveOrZero
    private BigDecimal otherCharges;

    @NotNull(message = "Place of Supply State ID is required")
    private UUID placeOfSupplyStateId;

    @NotEmpty(message = "At least one line item is mandatory")
    @Valid
    private List<QuotationItemRequest> items;

    private UUID paymentTermId;
    private String paymentTerms;
    private UUID deliveryTermId;
    private String deliveryTerms;
    private UUID warrantyTermId;
    private String warrantyTerms;
    private UUID termsConditionId;
    private String termsAndConditions;    
    @Size(max = 1000)
    private String notes;
}
