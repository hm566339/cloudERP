package com.erp.account.modules.customer.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @Size(max = 50, message = "Customer code cannot exceed 50 characters")
    private String customerCode;

    @NotBlank(message = "Customer name is required")
    @Size(min = 2, max = 200, message = "Customer name must be between 2 and 200 characters")
    private String customerName;

    @Size(max = 15, message = "GSTIN must be maximum 15 characters")
    private String gstin;

    @Size(max = 10, message = "PAN must be maximum 10 characters")
    private String panNo;

    @Email(message = "Email must be valid")
    private String email;

    @Pattern(regexp = "^[0-9]{10}$|^$", message = "Phone must be 10 digits or empty")
    private String phone;

    @DecimalMin(value = "0", inclusive = true, message = "Credit limit must be non-negative")
    private BigDecimal creditLimit;

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    private List<CustomerAddressRequest> addresses;
}
