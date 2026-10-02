package com.erp.account.modules.reporting.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashFlowReportResponse extends BaseResponseDto  implements Serializable {

    private Summary summary;
    private OpeningClosingBalance openingClosingBalance;
    private ActivitySection operatingActivities;
    private ActivitySection investingActivities;
    private ActivitySection financingActivities;
    private List<BankAccountSummary> bankAccounts;
    private List<CashAccountSummary> cashAccounts;
    private List<CashFlowTransaction> transactions;
    private List<MonthlySummary> monthlySummary;
    private CashFlowStatistics statistics;
    private RelatedDocuments relatedDocuments;
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Summary implements Serializable {
        private LocalDate startDate;
        private LocalDate endDate;
        private java.util.UUID companyId;
        private String companyName;
        private String baseCurrency;
        private java.time.LocalDateTime reportGeneratedAt;
        private String generatedBy;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OpeningClosingBalance implements Serializable {
        private BigDecimal openingCashBalance;
        private BigDecimal totalCashInflow;
        private BigDecimal totalCashOutflow;
        private BigDecimal netOperatingCashFlow;
        private BigDecimal netInvestingCashFlow;
        private BigDecimal netFinancingCashFlow;
        private BigDecimal netCashFlow;
        private BigDecimal closingCashBalance;
        private Integer totalTransactions;
        
        // Comparison
        private BigDecimal previousNetCashFlow;
        private BigDecimal varianceAmount;
        private BigDecimal variancePercentage;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivitySection implements Serializable {
        private List<CashFlowLine> cashIn;
        private List<CashFlowLine> cashOut;
        private BigDecimal totalCashIn;
        private BigDecimal totalCashOut;
        private BigDecimal netCashFlow;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashFlowLine implements Serializable {
        private String category;
        private BigDecimal amount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankAccountSummary implements Serializable {
        private java.util.UUID accountId;
        private String accountCode;
        private String accountName;
        private BigDecimal openingBalance;
        private BigDecimal totalReceipts;
        private BigDecimal totalPayments;
        private BigDecimal closingBalance;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashAccountSummary implements Serializable {
        private BigDecimal cashInHand;
        private BigDecimal pettyCash;
        private BigDecimal openingBalance;
        private BigDecimal receipts;
        private BigDecimal payments;
        private BigDecimal closingBalance;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashFlowTransaction implements Serializable {
        private java.util.UUID transactionId;
        private String voucherNo;
        private LocalDate voucherDate;
        private java.util.UUID accountId;
        private String accountCode;
        private String accountName;
        private String accountGroup;
        private java.util.UUID branchId;
        private String branchName;
        private java.util.UUID departmentId;
        private String departmentName;
        private java.util.UUID projectId;
        private String projectName;
        private java.util.UUID costCenterId;
        private String costCenterName;
        private String paymentMode;
        private String currencyCode;
        private BigDecimal exchangeRate;
        private String cashFlowType;
        private String cashDirection;
        private String referenceNo;
        private String narration;
        private BigDecimal amount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlySummary implements Serializable {
        private String month;
        private BigDecimal cashIn;
        private BigDecimal cashOut;
        private BigDecimal netCashFlow;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashFlowStatistics implements Serializable {
        private BigDecimal totalReceipts;
        private BigDecimal totalPayments;
        private Integer totalTransactions;
        private Integer operatingTransactionCount;
        private Integer investingTransactionCount;
        private Integer financingTransactionCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RelatedDocuments implements Serializable {
        private List<java.util.UUID> receiptVouchers;
        private List<java.util.UUID> paymentVouchers;
        private List<java.util.UUID> journalEntries;
        private List<java.util.UUID> bankTransactions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditInfo implements Serializable {
        private java.time.LocalDateTime generatedAt;
        private String generatedBy;
        private String reportVersion;
    }
}
