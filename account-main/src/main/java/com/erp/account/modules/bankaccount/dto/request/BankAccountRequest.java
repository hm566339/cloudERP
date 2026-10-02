package com.erp.account.modules.bankaccount.dto.request;

import com.erp.account.enums.BankAccountType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountRequest {

    @NotBlank(message = "Bank name is required")
    @Size(max = 200, message = "Bank name must be 200 characters or fewer")
    private String bankName;

    @Size(max = 200, message = "Branch name must be 200 characters or fewer")
    private String branchName;

    @NotBlank(message = "Account number is required")
    @Pattern(regexp = "^[A-Za-z0-9]{6,30}$", message = "Account number must be 6-30 alphanumeric characters")
    private String accountNumber;

    @NotBlank(message = "IFSC code is required")
    @Pattern(regexp = "^[A-Za-z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
    private String ifscCode;

    @Pattern(regexp = "^[\\w.\\-]{2,256}@[A-Za-z]{2,64}$", message = "Invalid UPI ID format")
    private String upiId;

    @Size(max = 255, message = "Account holder name must be 255 characters or fewer")
    private String accountHolderName;

    @Size(max = 20, message = "SWIFT code must be 20 characters or fewer")
    private String swiftCode;

    private Boolean isPrimary = false;

    @NotNull(message = "Account type is required")
    private BankAccountType accountType;

    @NotNull(message = "Opening balance is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Opening balance cannot be negative")
    private BigDecimal openingBalance;

    @NotNull(message = "Account active status is required")
    private Boolean isActive;
}
