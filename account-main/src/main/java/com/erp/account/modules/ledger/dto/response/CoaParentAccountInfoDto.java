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
public class CoaParentAccountInfoDto {
    private UUID parentAccountId;
    private String parentAccountCode;
    private String parentAccountName;
}
