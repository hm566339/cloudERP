package com.erp.account.modules.gstslab.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class GstSlabProfileResponse extends GstSlabResponse {
    private GstTaxConfigurationDto taxConfiguration;
    private List<GstLinkedItemDto> linkedProducts;
    private List<GstSalesTransactionDto> salesTransactions;
    private List<GstPurchaseTransactionDto> purchaseTransactions;
    private GstSummaryDto gstSummary;
    private GstStatisticsDto statistics;
    private List<GstRecentTransactionDto> recentTransactions;
    private GstAuditInfoDto auditInformation;
}
