package com.erp.account.modules.accountgroup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChildGroupDto {
    private UUID groupId;
    private String groupCode;
    private String groupName;
    private Integer totalLedgers;
    private BigDecimal totalBalance;
}
