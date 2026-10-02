package com.erp.account.modules.reporting.service.impl;

import com.erp.account.modules.reporting.dto.response.CashFlowReportResponse;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.reporting.service.CashFlowReportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.reporting.dto.request.CashFlowRequest;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CashFlowReportServiceImpl implements CashFlowReportService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final BankAccountRepository bankAccountRepository;


    @Override
    public CashFlowReportResponse getCashFlowReport(CashFlowRequest request) {
         UUID effectiveCompanyId = TenantUtils.resolveCompanyId(request.getCompanyId());
         if (request.getStartDate() != null && request.getEndDate() != null && request.getStartDate().isAfter(request.getEndDate())) {
             throw new com.erp.account.common.exception.BusinessException("startDate cannot be after endDate");
         }

        List<SalesInvoice> salesInvoices = salesInvoiceRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId, Pageable.unpaged()).getContent();
        List<ApInvoice> apInvoices = apInvoiceRepository.findInvoicesByDateRange(effectiveCompanyId, request.getStartDate(), request.getEndDate(), Pageable.unpaged()).getContent();
        
        BigDecimal operatingCashIn = salesInvoices.stream()
                .map(invoice -> defaultAmount(invoice.getReceivedAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal operatingCashOut = apInvoices.stream()
                .map(invoice -> defaultAmount(invoice.getPaidAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal investingCashIn = BigDecimal.ZERO;
        BigDecimal investingCashOut = BigDecimal.ZERO;
        BigDecimal financingCashIn = BigDecimal.ZERO;
        BigDecimal financingCashOut = BigDecimal.ZERO;
        
        BigDecimal netOperatingCashFlow = operatingCashIn.subtract(operatingCashOut);
        BigDecimal netInvestingCashFlow = investingCashIn.subtract(investingCashOut);
        BigDecimal netFinancingCashFlow = financingCashIn.subtract(financingCashOut);
        BigDecimal netCashFlow = netOperatingCashFlow.add(netInvestingCashFlow).add(netFinancingCashFlow);

        BigDecimal openingCashBalance = bankAccountRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId).stream()
                .map(account -> defaultAmount(account.getOpeningBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal closingCashBalance = openingCashBalance.add(netCashFlow);

        // 1. Summary
        CashFlowReportResponse.Summary summary = CashFlowReportResponse.Summary.builder()
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .companyId(effectiveCompanyId)
                .companyName("Enterprise Co.") // Placeholder, ideally fetch from company service
                .baseCurrency("USD")
                .reportGeneratedAt(java.time.LocalDateTime.now())
                .generatedBy("System")
                .build();

        // 2. Opening & Closing Cash
        CashFlowReportResponse.OpeningClosingBalance balances = CashFlowReportResponse.OpeningClosingBalance.builder()
                .openingCashBalance(openingCashBalance)
                .totalCashInflow(operatingCashIn.add(investingCashIn).add(financingCashIn))
                .totalCashOutflow(operatingCashOut.add(investingCashOut).add(financingCashOut))
                .netOperatingCashFlow(netOperatingCashFlow)
                .netInvestingCashFlow(netInvestingCashFlow)
                .netFinancingCashFlow(netFinancingCashFlow)
                .netCashFlow(netCashFlow)
                .closingCashBalance(closingCashBalance)
                .totalTransactions(salesInvoices.size() + apInvoices.size())
                .previousNetCashFlow(BigDecimal.ZERO)
                .varianceAmount(BigDecimal.ZERO)
                .variancePercentage(BigDecimal.ZERO)
                .build();

        // 3. Operating Activities
        List<CashFlowReportResponse.CashFlowLine> operatingInLines = new ArrayList<>();
        operatingInLines.add(new CashFlowReportResponse.CashFlowLine("Customer Receipts", operatingCashIn));
        
        List<CashFlowReportResponse.CashFlowLine> operatingOutLines = new ArrayList<>();
        operatingOutLines.add(new CashFlowReportResponse.CashFlowLine("Vendor Payments", operatingCashOut));
        
        CashFlowReportResponse.ActivitySection operatingActivities = CashFlowReportResponse.ActivitySection.builder()
                .cashIn(operatingInLines)
                .cashOut(operatingOutLines)
                .totalCashIn(operatingCashIn)
                .totalCashOut(operatingCashOut)
                .netCashFlow(netOperatingCashFlow)
                .build();

        // 4. Investing Activities
        CashFlowReportResponse.ActivitySection investingActivities = CashFlowReportResponse.ActivitySection.builder()
                .cashIn(new ArrayList<>())
                .cashOut(new ArrayList<>())
                .totalCashIn(investingCashIn)
                .totalCashOut(investingCashOut)
                .netCashFlow(netInvestingCashFlow)
                .build();

        // 5. Financing Activities
        CashFlowReportResponse.ActivitySection financingActivities = CashFlowReportResponse.ActivitySection.builder()
                .cashIn(new ArrayList<>())
                .cashOut(new ArrayList<>())
                .totalCashIn(financingCashIn)
                .totalCashOut(financingCashOut)
                .netCashFlow(netFinancingCashFlow)
                .build();

        // 6. Bank Account Summary
        List<CashFlowReportResponse.BankAccountSummary> bankAccounts = bankAccountRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId).stream()
                .map(account -> CashFlowReportResponse.BankAccountSummary.builder()
                        .accountId(account.getId())
                        .accountCode(account.getAccountNumber())
                        .accountName(account.getBankName())
                        .openingBalance(defaultAmount(account.getOpeningBalance()))
                        .totalReceipts(BigDecimal.ZERO) // Replace with actual aggregate
                        .totalPayments(BigDecimal.ZERO) // Replace with actual aggregate
                        .closingBalance(defaultAmount(account.getOpeningBalance()))
                        .build())
                .toList();

        // 7. Cash Account Summary
        List<CashFlowReportResponse.CashAccountSummary> cashAccounts = new ArrayList<>();
        
        // 8. Transactions
        List<CashFlowReportResponse.CashFlowTransaction> transactions = new ArrayList<>();

        // 9. Monthly Summary
        List<CashFlowReportResponse.MonthlySummary> monthlySummary = new ArrayList<>();

        // 10. Statistics
        CashFlowReportResponse.CashFlowStatistics statistics = CashFlowReportResponse.CashFlowStatistics.builder()
                .totalReceipts(operatingCashIn)
                .totalPayments(operatingCashOut)
                .totalTransactions(0)
                .operatingTransactionCount(0)
                .investingTransactionCount(0)
                .financingTransactionCount(0)
                .build();

        // 11. Related Documents
        CashFlowReportResponse.RelatedDocuments relatedDocuments = CashFlowReportResponse.RelatedDocuments.builder()
                .receiptVouchers(new ArrayList<>())
                .paymentVouchers(new ArrayList<>())
                .journalEntries(new ArrayList<>())
                .bankTransactions(new ArrayList<>())
                .build();

        // 12. Audit
        CashFlowReportResponse.AuditInfo audit = CashFlowReportResponse.AuditInfo.builder()
                .generatedAt(java.time.LocalDateTime.now())
                .generatedBy("System")
                .reportVersion("1.0")
                .build();

        return CashFlowReportResponse.builder()
                .summary(summary)
                .openingClosingBalance(balances)
                .operatingActivities(operatingActivities)
                .investingActivities(investingActivities)
                .financingActivities(financingActivities)
                .bankAccounts(bankAccounts)
                .cashAccounts(cashAccounts)
                .transactions(transactions)
                .monthlySummary(monthlySummary)
                .statistics(statistics)
                .relatedDocuments(relatedDocuments)

                .build();
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
