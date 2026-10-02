package com.erp.account.modules.reporting.service;

import com.erp.account.modules.report.dto.response.TrialBalanceResponse;
import com.erp.account.modules.report.dto.response.TrialBalanceRow;
import com.erp.account.modules.report.dto.response.TrialBalanceSummaryResponse;
import com.erp.account.modules.reporting.dto.request.ReportFilter;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ReportGenerationException;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.reporting.service.ReportService;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

        private final GlJournalLineRepository glJournalLineRepository;
        private final CompanyService companyService;

        @Override
        public TrialBalanceResponse getTrialBalance(ReportFilter filter) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String username = (authentication != null) ? authentication.getName() : "anonymous";
                String roles = (authentication != null && authentication.getAuthorities() != null)
                                ? authentication.getAuthorities().toString()
                                : "[]";

                UUID reqCompanyId = filter.getCompanyId();
                UUID company = TenantUtils.resolveCompanyIdForQuery(reqCompanyId);

                log.info("Generating Report Trial Balance - User: {}, Roles: {}, RequestCompanyId: {}, ResolvedCompanyId: {}",
                                username, roles, reqCompanyId, company);

                if (company != null) {
                        // validate company exists - throws ResourceNotFoundException -> 404
                        companyService.getCompany(company);
                }

                LocalDate start = filter.getFromDate() != null ? filter.getFromDate() : LocalDate.of(1900, 1, 1);
                LocalDate end = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();

                List<GlJournalLineRepository.TrialBalanceProjection> projections;
                try {
                        if (company != null) {
                                projections = glJournalLineRepository.aggregateTrialBalance(company, start, end);
                        } else {
                                projections = glJournalLineRepository.aggregateTrialBalanceAllCompanies(start, end);
                        }
                } catch (Exception ex) {
                        log.error("Failed to generate Report Trial Balance for company {}: {}", company,
                                        ex.getMessage(), ex);
                        throw new ReportGenerationException("Unable to generate Report Trial Balance", ex);
                }

                List<TrialBalanceRow> rows = new ArrayList<>();
                BigDecimal totalOpening = BigDecimal.ZERO;
                BigDecimal totalDebit = BigDecimal.ZERO;
                BigDecimal totalCredit = BigDecimal.ZERO;
                BigDecimal totalClosing = BigDecimal.ZERO;

                for (GlJournalLineRepository.TrialBalanceProjection p : projections) {
                        BigDecimal openingDebit = p.getOpeningDebit() != null ? p.getOpeningDebit() : BigDecimal.ZERO;
                        BigDecimal openingCredit = p.getOpeningCredit() != null ? p.getOpeningCredit()
                                        : BigDecimal.ZERO;
                        BigDecimal periodDebit = p.getPeriodDebit() != null ? p.getPeriodDebit() : BigDecimal.ZERO;
                        BigDecimal periodCredit = p.getPeriodCredit() != null ? p.getPeriodCredit() : BigDecimal.ZERO;

                        BigDecimal openingBalance = openingDebit.subtract(openingCredit);
                        BigDecimal closingBalance = openingBalance.add(periodDebit).subtract(periodCredit);

                        TrialBalanceRow row = TrialBalanceRow.builder()
                                        .accountId(p.getAccountId() != null ? UUID.fromString(p.getAccountId()) : null)
                                        .accountCode(p.getAccountCode())
                                        .accountName(p.getAccountName())
                                        .openingDebit(openingDebit)
                                        .openingCredit(openingCredit)
                                        .periodDebit(periodDebit)
                                        .periodCredit(periodCredit)
                                        .openingBalance(openingBalance)
                                        .debitTotal(periodDebit)
                                        .creditTotal(periodCredit)
                                        .closingBalance(closingBalance)
                                        .build();

                        rows.add(row);

                        totalOpening = totalOpening.add(openingBalance);
                        totalDebit = totalDebit.add(periodDebit);
                        totalCredit = totalCredit.add(periodCredit);
                        totalClosing = totalClosing.add(closingBalance);
                }

                // build response
                TrialBalanceSummaryResponse summary = TrialBalanceSummaryResponse.builder()
                                .totalOpening(totalOpening)
                                .totalDebit(totalDebit)
                                .totalCredit(totalCredit)
                                .totalClosing(totalClosing)
                                .build();

                log.info("Report Trial Balance generated successfully - Rows: {}, Opening: {}, Debit: {}, Credit: {}, Closing: {}",
                                rows.size(), totalOpening, totalDebit, totalCredit, totalClosing);

                return TrialBalanceResponse.builder()
                                .rows(rows)
                                .summary(summary)
                                .generatedAt(LocalDateTime.now())
                                .build();
        }
}
