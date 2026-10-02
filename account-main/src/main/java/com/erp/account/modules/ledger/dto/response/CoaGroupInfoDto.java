package com.erp.account.modules.ledger.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoaGroupInfoDto {
    private UUID groupId;
    private String groupCode;
    private String groupName;
    private String categoryName;
    private String nature;
}
