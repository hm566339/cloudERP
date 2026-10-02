package com.erp.account.modules.accountgroup.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountGroupResponse extends BaseResponseDto  {

    private UUID id;

    private UUID companyId;

    private UUID categoryId;

    private String categoryName;

    private UUID parentGroupId;

    private String parentGroupName;

    private String code;

    private String name;

    private Boolean deleted;
}
