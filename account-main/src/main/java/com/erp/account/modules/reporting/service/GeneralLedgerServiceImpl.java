package com.erp.account.modules.reporting.service;

import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.modules.report.dto.response.AppliedFiltersResponse;
import com.erp.account.modules.report.dto.response.BalanceDto;
import com.erp.account.modules.report.dto.response.GeneralLedgerResponse;
import com.erp.account.modules.report.dto.response.LedgerTransactionResponse;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import com.erp.account.enums.AccountNature;
import com.erp.account.enums.BalanceType;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.reporting.exception.GeneralLedgerException;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.erp.account.common.exception.BusinessException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeneralLedgerServiceImpl implements GeneralLedgerService {

    private final GlJournalLineRepository glJournalLineRepository;
    private final CompanyService companyService;
    private final ChartOfAccountRepository chartOfAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public GeneralLedgerResponse generateGeneralLedger(GeneralLedgerRequest request, UUID company_Id) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(company_Id);

        // validate company exists
        CompanyResponse company = companyService.getCompany(companyId);

        if (request.getAccountId() == null) {
            throw new BusinessException("Account ID is required for General Ledger report.");
        }
        ChartOfAccount account = chartOfAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new com.erp.account.common.exception.ResourceNotFoundException("Account not found"));

        if (!account.getCompany().getId().equals(companyId)) {
            throw new BusinessException("Account does not belong to the current company.");
        }

        if (request.getFromDate() != null && request.getToDate() != null
                && request.getFromDate().isAfter(request.getToDate())) {
            throw new BusinessException("fromDate cannot be after toDate");
        }

        AccountNature accountNature = account.getAccountType();

        // 1. Calculate Opening Balance dynamically via Specification
        BalanceDto openingBalanceDto = null;
        BigDecimal openingBalanceVal = BigDecimal.ZERO;

        if (Boolean.TRUE.equals(request.getIncludeOpening()) && request.getFromDate() != null) {
            Specification<GlJournalLine> openSpec = GlJournalLineSpecification.getFilterSpecification(request,
                    companyId, true);
            List<GlJournalLine> openLines = glJournalLineRepository.findAll(openSpec);
            BigDecimal openDebit = BigDecimal.ZERO;
            BigDecimal openCredit = BigDecimal.ZERO;
            for (GlJournalLine l : openLines) {
                if (l.getDebitAmount() != null)
                    openDebit = openDebit.add(l.getDebitAmount());
                if (l.getCreditAmount() != null)
                    openCredit = openCredit.add(l.getCreditAmount());
            }
            if (accountNature == com.erp.account.enums.AccountNature.CREDIT) {
                openingBalanceVal = openCredit.subtract(openDebit);
            } else {
                openingBalanceVal = openDebit.subtract(openCredit);
            }
            BalanceType openingBalanceType;
            if (accountNature == com.erp.account.enums.AccountNature.CREDIT) {
                openingBalanceType = openingBalanceVal.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.CR
                        : BalanceType.DR;
            } else {
                openingBalanceType = openingBalanceVal.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.DR
                        : BalanceType.CR;
            }
            openingBalanceDto = BalanceDto.builder()
                    .amount(openingBalanceVal.abs())
                    .balanceType(openingBalanceType)
                    .build();
        }

        // 2. Fetch Transactions chronologically
        Sort chronologicalSort = Sort.by(Sort.Direction.ASC, "journalEntry.voucherDate", "journalEntry.createdAt",
                "id");
        Specification<GlJournalLine> mainSpec = GlJournalLineSpecification.getFilterSpecification(request, companyId,
                false);
        List<GlJournalLine> allLines = glJournalLineRepository.findAll(mainSpec, chronologicalSort);

        BigDecimal running = openingBalanceVal;
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        List<LedgerTransactionResponse> allTransactions = new java.util.ArrayList<>();
        for (GlJournalLine line : allLines) {
            BigDecimal debit = line.getDebitAmount() != null ? line.getDebitAmount() : BigDecimal.ZERO;
            BigDecimal credit = line.getCreditAmount() != null ? line.getCreditAmount() : BigDecimal.ZERO;

            if (accountNature == com.erp.account.enums.AccountNature.CREDIT) {
                running = running.add(credit).subtract(debit);
            } else {
                running = running.add(debit).subtract(credit);
            }

            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);

            ChartOfAccount lineAccount = line.getAccount();

            BalanceType currentBalType;
            if (accountNature == com.erp.account.enums.AccountNature.CREDIT) {
                currentBalType = running.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.CR : BalanceType.DR;
            } else {
                currentBalType = running.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.DR : BalanceType.CR;
            }

            BalanceDto runningBalDto = BalanceDto.builder()
                    .amount(running.abs())
                    .balanceType(currentBalType)
                    .build();

            boolean isSameAccount = request.getAccountId() != null && lineAccount != null
                    && request.getAccountId().equals(lineAccount.getId());
            boolean isSameCurrency = java.util.Objects.equals(company.getBaseCurrency(),
                    line.getCurrencyCode() != null ? line.getCurrencyCode() : company.getBaseCurrency());

            LedgerTransactionResponse trx = LedgerTransactionResponse.builder()
                    .lineId(line.getId())
                    .journalEntryId(line.getJournalEntry() != null ? line.getJournalEntry().getId() : null)
                    .voucherDate(line.getJournalEntry() != null ? line.getJournalEntry().getVoucherDate() : null)
                    .voucherType(line.getJournalEntry() != null ? line.getJournalEntry().getSourceModule() : null)
                    .voucherNumber(line.getJournalEntry() != null ? line.getJournalEntry().getVoucherNo() : null)
                    .referenceNo(line.getJournalEntry() != null ? line.getJournalEntry().getReferenceNo() : null)
                    .accountCode(isSameAccount ? null : (lineAccount != null ? lineAccount.getAccountCode() : null))
                    .accountName(isSameAccount ? null : (lineAccount != null ? lineAccount.getAccountName() : null))
                    .description(line.getLineDescription())
                    .narration(line.getJournalEntry() != null ? line.getJournalEntry().getNarration() : null)
                    .debit(debit)
                    .credit(credit)
                    .runningBalance(runningBalDto)
                    .currency(isSameCurrency ? null : line.getCurrencyCode())
                    .status(line.getJournalEntry() != null ? line.getJournalEntry().getStatus() : null)
                    .createdBy(line.getJournalEntry() != null && line.getJournalEntry().getCreatedBy() != null
                            ? line.getJournalEntry().getCreatedBy().toString()
                            : null)
                    .postedAt(line.getJournalEntry() != null ? line.getJournalEntry().getPostedAt() : null)
                    .branchCode(line.getBranchId() != null ? line.getBranchId().toString() : null)
                    .costCenterCode(line.getCostCenterId() != null ? line.getCostCenterId().toString() : null)
                    .projectCode(line.getProjectId() != null ? line.getProjectId().toString() : null)
                    .build();

            allTransactions.add(trx);
        }

        // Apply display sorting if requested
        if ("DESC".equalsIgnoreCase(request.getSortDirection())) {
            java.util.Collections.reverse(allTransactions);
        }

        // 3. Paginate the correctly calculated transactions
        int pageNo = Math.max(0, request.getPage());
        int pageSize = Math.max(1, request.getPageSize());
        int totalElements = allTransactions.size();
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        int start = Math.min(pageNo * pageSize, totalElements);
        int end = Math.min(start + pageSize, totalElements);

        List<LedgerTransactionResponse> pageContent = allTransactions.subList(start, end);

        PaginationResponse pagination = PaginationResponse.builder()
                .page(pageNo + 1)
                .size(pageSize)
                .totalPages(totalPages)
                .totalElements((long) totalElements)
                .first(pageNo == 0)
                .last(pageNo == totalPages - 1 || totalPages == 0)
                .build();

        // Prepare applied filters for metadata
        AppliedFiltersResponse filters = AppliedFiltersResponse.builder()
                .companyId(companyId)
                .accountId(request.getAccountId())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .status(request.getStatus())
                .branchId(request.getBranchId())
                .costCenterId(request.getCostCenterId())
                .projectId(request.getProjectId())
                .build();

        BalanceDto closingBalanceDto = null;
        if (Boolean.TRUE.equals(request.getIncludeClosing())) {
            BalanceType closingBalanceType;
            if (accountNature == com.erp.account.enums.AccountNature.CREDIT) {
                closingBalanceType = running.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.CR : BalanceType.DR;
            } else {
                closingBalanceType = running.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.DR : BalanceType.CR;
            }
            closingBalanceDto = BalanceDto.builder()
                    .amount(running.abs())
                    .balanceType(closingBalanceType)
                    .build();
        }

        return GeneralLedgerResponse.builder()
                .companyId(companyId)
                .companyName(company.getCompanyName())
                .accountId(account != null ? account.getId() : null)
                .accountCode(account != null ? account.getAccountCode() : null)
                .accountName(account != null ? account.getAccountName() : null)
                .accountType(account != null && account.getGroup() != null && account.getGroup().getCategory() != null
                        ? account.getGroup().getCategory().getName()
                        : null)
                .accountCategory(account != null && account.getGroup() != null ? account.getGroup().getName() : null)
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .currency(company.getBaseCurrency())
                .transactions(pageContent)
                .openingBalance(Boolean.TRUE.equals(request.getIncludeOpening()) ? openingBalanceDto : null)
                .closingBalance(closingBalanceDto)
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .pagination(pagination)
                .appliedFilters(filters)
                .generatedAt(LocalDateTime.now())
                .build();
    }
}
