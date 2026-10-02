package com.erp.account.modules.accountcategory.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.AccountNature;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountCategoryResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;

    private UUID companyId;

    private String code;

    private String name;

    private AccountNature nature;

    private Boolean isDeleted;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
