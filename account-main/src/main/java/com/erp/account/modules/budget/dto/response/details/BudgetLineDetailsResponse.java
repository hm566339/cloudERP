package com.erp.account.modules.budget.dto.response.details;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetLineDetailsResponse extends BaseResponseDto  implements Serializable {
    private BudgetLineResponse budgetLine;
    private BudgetHeaderInfoDto budgetHeader;
    private CompanyInfoDto company;
    private GlAccountInfoDto glAccount;
    private DepartmentInfoDto department;
    private PerformanceSummaryDto performanceSummary;
    private BudgetHealthDto health;
    private PaginatedTransactionsDto transactions;
    private List<MonthlyTrendDto> monthlyTrend;
    private AnalyticsDto analytics;
    private RelatedDocumentsDto relatedDocuments;
    private ApprovalInfoDto approval;
    private List<AttachmentDto> attachments;
    private PermissionsDto permissions;
    private MetadataDto metadata;
}
