package com.erp.account.modules.accountgroup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupHierarchyDto {
    private String rootGroup;
    private String parentGroup;
    private String currentGroup;
    private List<String> childGroups;
    private Integer levelDepth;
}
