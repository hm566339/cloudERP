package com.erp.account.modules.ledger.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoaHierarchyDto {
    private String category;
    private String accountGroup;
    private String parentAccount;
    private String currentAccount;
    private List<String> childAccounts;
}
