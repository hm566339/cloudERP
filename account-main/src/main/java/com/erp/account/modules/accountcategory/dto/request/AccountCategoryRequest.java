package com.erp.account.modules.accountcategory.dto.request;

import com.erp.account.enums.AccountNature;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;

/**
 * Request DTO for creating or updating an Account Category.
 * Note: 'code' is fully system-generated and is NOT accepted from the client request.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountCategoryRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Category name is required")
    private String name;

    @NotNull(message = "Category nature is required")
    private AccountNature nature;
}
