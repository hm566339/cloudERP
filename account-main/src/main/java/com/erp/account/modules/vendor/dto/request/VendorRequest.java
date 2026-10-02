package com.erp.account.modules.vendor.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.erp.account.util.VendorConstants;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorRequest {

    @Size(max = 50, message = "Vendor code cannot exceed 50 characters")
    private String vendorCode;

    @NotBlank(message = "Vendor name is mandatory")
    @Size(max = 255, message = "Vendor name cannot exceed 255 characters")
    private String vendorName;

    @Pattern(regexp = VendorConstants.GSTIN_REGEX, message = "Invalid GSTIN format. Expected 15 character pattern")
    private String gstin;

    @Pattern(regexp = VendorConstants.PAN_REGEX, message = "Invalid PAN format. Expected 10 character pattern")
    private String panNo;

    @Email(message = "Email should be valid")
    private String email;

    @Pattern(regexp = "^\\+?[0-9\\- ]{7,20}$", message = "Phone number should be 7-20 digits with optional + prefix")
    private String phone;

    @Size(max = 500, message = "Address line cannot exceed 500 characters")
    private String addressLine1;

    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    @Size(max = 100, message = "State cannot exceed 100 characters")
    private String state;

    @Size(max = 100, message = "Country cannot exceed 100 characters")
    private String country;

    @Size(max = 10, message = "Pin code cannot exceed 10 characters")
    private String pinCode;

    @NotNull(message = "Credit limit is mandatory")
    @DecimalMin(value = "0.0", inclusive = true, message = "Credit limit cannot be negative")
    private BigDecimal creditLimit;

    @NotNull(message = "Payable account is mandatory")
    private UUID payableAccountId;

    @DecimalMin(value = "0.0", inclusive = true, message = "Opening balance cannot be negative")
    private BigDecimal openingBalance;

    private LocalDate openingBalanceDate;

    @Min(value = 0, message = "Payment term days cannot be negative")
    private Integer paymentTermDays;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Default currency must be a 3-letter ISO code")
    private String defaultCurrency;

    private Boolean tdsApplicable = false;

    @Size(max = 30, message = "TDS section cannot exceed 30 characters")
    private String tdsSection;

    private BigDecimal tdsRate;

    @NotNull(message = "Active status is mandatory")
    private Boolean isActive;
}
