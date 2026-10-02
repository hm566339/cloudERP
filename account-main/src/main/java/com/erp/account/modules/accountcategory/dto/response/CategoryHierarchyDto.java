package com.erp.account.modules.accountcategory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryHierarchyDto {
    private String category;
    private List<String> groups;
    private List<String> subGroups;
    private List<String> ledgers;
}
