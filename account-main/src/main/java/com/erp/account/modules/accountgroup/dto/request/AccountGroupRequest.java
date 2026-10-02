package com.erp.account.modules.accountgroup.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountGroupRequest {

    @NotNull(message = "Category id is required")
    private UUID categoryId;

    private UUID parentGroupId;
    @NotBlank(message = "Group name is required")
    @Size(max = 100, message = "Group name must not exceed 100 characters")
    private String name;

    @Size(max = 50, message = "Group code must not exceed 50 characters")
    private String code;
}
