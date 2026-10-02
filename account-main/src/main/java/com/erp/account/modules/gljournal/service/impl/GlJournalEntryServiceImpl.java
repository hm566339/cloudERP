package com.erp.account.modules.gljournal.service.impl;

import com.erp.account.modules.reporting.dto.response.BalanceSheetReport;
import com.erp.account.modules.reporting.dto.response.GeneralLedgerLine;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryListResponse;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.reporting.dto.response.ProfitLossReport;
import com.erp.account.modules.reporting.dto.response.TrialBalanceLine;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.enums.AccountNature;
import com.erp.account.enums.PostingStatus;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.InvalidOperationException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.gljournal.mapper.GlJournalEntryMapper;
import com.erp.account.modules.gljournal.mapper.GlJournalLineMapper;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.reporting.entity.BalanceSnapshot;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryFilterDto;
import com.erp.account.modules.gljournal.specification.GlJournalEntrySpecification;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.auditlog.repository.AuditLogRepository;
import com.erp.account.modules.reporting.repository.BalanceSnapshotRepository;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.JournalConstants;
import com.erp.account.util.JournalHashUtil;
import com.erp.account.util.JournalValidationUtil;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.common.service.VoucherNumberGenerator;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;


@Service
@AllArgsConstructor
@Slf4j
public class GlJournalEntryServiceImpl implements GlJournalEntryService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private final ObjectMapper objectMapper;

    private final GlJournalEntryRepository journalEntryRepository;
    private final GlJournalLineRepository journalLineRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final CompanyRepository companyRepository;
    private final FiscalYearRepository fiscalYearRepository;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final BalanceSnapshotRepository balanceSnapshotRepository;
    private final AuditLogRepository auditLogRepository;
    private final GlJournalEntryMapper journalEntryMapper;
    private final GlJournalLineMapper journalLineMapper;
    private final VoucherNumberGenerator voucherNumberGenerator;

    @Override
    @Transactional
    public GlJournalEntryResponse createJournalEntry(RequestWrapper<GlJournalEntryRequest> requestWrapper, UUID companyIdUUID) {
        GlJournalEntryRequest request = requestWrapper.unwrap();
        UUID companyId = TenantUtils.resolveCompanyId(companyIdUUID);
        log.info("Creating GL journal entry for company {}", companyId);
        validateJournalEntry(request);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        FiscalYear fiscalYear = resolveFiscalYear(company, request);
        AccountingPeriod accountingPeriod = resolveAccountingPeriod(company, fiscalYear, request);

        if (Boolean.TRUE.equals(fiscalYear.getIsClosed())) {
            throw new ValidationException("Cannot create journal entry in a closed fiscal year");
        }
        if (accountingPeriod.getStatus() == com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.CLOSED
                || accountingPeriod.getStatus() == com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.LOCKED) {
            throw new ValidationException("Cannot create journal entry in a closed accounting period");
        }

        String voucherNo = voucherNumberGenerator.generateVoucherNo(company.getId(), request.getVoucherDate());

        if (journalEntryRepository.existsByVoucherNoAndCompanyIdAndIsDeletedFalse(voucherNo, company.getId())) {
            throw new ValidationException("Duplicate voucher number for company: " + voucherNo);
        }

        GlJournalEntry journalEntry = journalEntryMapper.requestToEntity(request);
        journalEntry.setCompany(company);
        journalEntry.setFiscalYear(fiscalYear);
        journalEntry.setAccountingPeriod(accountingPeriod);
        journalEntry.setVoucherNo(voucherNo);
        journalEntry.setStatus(PostingStatus.DRAFT);
        journalEntry.setHashAlgorithm(JournalConstants.JOURNAL_HASH_ALGORITHM);
        journalEntry.setCreatedBy(CurrentUserContext.getUserId());
        journalEntry.setUpdatedBy(CurrentUserContext.getUserId());

        // populate sourceModule and sourceId from request if provided programmatically
        if (request.getSourceId() != null) {
            journalEntry.setSourceModule(request.getSourceModule() != null ? request.getSourceModule() : SourceModule.MANUAL);
            journalEntry.setSourceId(request.getSourceId());
        } else {
            journalEntry.setSourceModule(SourceModule.MANUAL);
        }

        List<GlJournalLine> lines = request.getJournalLines().stream()
            .map(line -> buildJournalLine(line, journalEntry, company))
            .collect(Collectors.toList());

        journalEntry.setJournalLines(new HashSet<>(lines));
        calculateTotals(journalEntry);

        if (!journalEntry.isBalanced()) {
            throw new ValidationException("Journal entry must be balanced before save");
        }

        GlJournalEntry saved = journalEntryRepository.save(journalEntry);

        return journalEntryMapper.entityToResponse(saved);
    }

    @Override
    @Transactional
    public GlJournalEntryResponse updateJournalEntry(UUID journalEntryId, RequestWrapper<GlJournalEntryRequest> requestWrapper) {
        GlJournalEntryRequest request = requestWrapper.unwrap();
        log.info("Updating GL journal entry {}", journalEntryId);
        GlJournalEntry existing = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        if (!existing.canEdit()) {
            throw new InvalidOperationException("Only DRAFT journal entries can be updated");
        }

        validateJournalEntry(request);

        FiscalYear fiscalYear = resolveFiscalYear(existing.getCompany(), request);
        AccountingPeriod accountingPeriod = resolveAccountingPeriod(existing.getCompany(), fiscalYear, request);

        if (Boolean.TRUE.equals(fiscalYear.getIsClosed())) {
            throw new ValidationException("Cannot update journal entry in a closed fiscal year");
        }
        if (accountingPeriod.getStatus() == com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.CLOSED
                || accountingPeriod.getStatus() == com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.LOCKED) {
            throw new ValidationException("Cannot update journal entry in a closed accounting period");
        }

        journalEntryMapper.updateEntityFromRequest(request, existing);
        existing.setFiscalYear(fiscalYear);
        existing.setAccountingPeriod(accountingPeriod);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        existing.getJournalLines().clear();
        List<GlJournalLine> lines = request.getJournalLines().stream()
                .map(line -> buildJournalLine(line, existing, existing.getCompany()))
                .collect(Collectors.toList());
        existing.setJournalLines(new HashSet<>(lines));

        calculateTotals(existing);
        if (!existing.isBalanced()) {
            throw new ValidationException("Updated journal entry must remain balanced");
        }

        GlJournalEntry updated = journalEntryRepository.save(existing);

        return journalEntryMapper.entityToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteJournalEntry(UUID journalEntryId) {
        log.info("Deleting GL journal entry {}", journalEntryId);
        GlJournalEntry existing = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        if (!existing.canDelete()) {
            throw new InvalidOperationException("Only DRAFT journal entries can be deleted");
        }

        existing.setIsDeleted(true);
        existing.getJournalLines().forEach(line -> line.setIsDeleted(true));
        existing.setUpdatedBy(CurrentUserContext.getUserId());
        journalEntryRepository.save(existing);

    }

    @Override
    @Transactional
    public GlJournalEntryResponse postJournalEntry(UUID journalEntryId) {
        return postJournalEntryInternal(journalEntryId, "POST");
    }

    @Override
    @Transactional
    public GlJournalEntryResponse reverseJournalEntry(UUID journalEntryId) {
        log.info("Reversing GL journal entry {}", journalEntryId);
        GlJournalEntry original = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        if (!original.canReverse()) {
            throw new InvalidOperationException("Only POSTED entries can be reversed");
        }

        if (Boolean.TRUE.equals(original.getIsDeleted())) {
            throw new InvalidOperationException("Cannot reverse a deleted journal entry");
        }

        GlJournalEntry reverseEntry = GlJournalEntry.builder()
            .company(original.getCompany())
            .fiscalYear(original.getFiscalYear())
            .accountingPeriod(original.getAccountingPeriod())
            .voucherDate(original.getVoucherDate())
            .referenceNo(original.getReferenceNo())
            .sourceModule(com.erp.account.modules.gljournal.enums.SourceModule.MANUAL)
            .sourceId(original.getId())
            .narration("Reversal of " + original.getVoucherNo() + " - " + original.getNarration())
            .status(PostingStatus.DRAFT)
            .hashAlgorithm(JournalConstants.JOURNAL_HASH_ALGORITHM)
            .build();

        // set auditing fields inherited from BaseEntity
        reverseEntry.setCreatedBy(CurrentUserContext.getUserId());
        reverseEntry.setUpdatedBy(CurrentUserContext.getUserId());

        reverseEntry.setVoucherNo(generateVoucherNo(original.getCompany().getId(), original.getVoucherDate()));

        List<GlJournalLine> reversedLines = original.getJournalLines().stream()
                .filter(line -> !Boolean.TRUE.equals(line.getIsDeleted()))
                .map(line -> {
                    GlJournalLine reversedLine = GlJournalLine.builder()
                            .company(line.getCompany())
                            .journalEntry(reverseEntry)
                            .account(line.getAccount())
                            .debitAmount(line.getCreditAmount())
                            .creditAmount(line.getDebitAmount())
                            .currencyCode(line.getCurrencyCode())
                            .exchangeRate(line.getExchangeRate())
                            .lineDescription("Reversal of line: " + line.getLineDescription())
                            .build();
                    return reversedLine;
                })
                .collect(Collectors.toList());

        reverseEntry.setJournalLines(new HashSet<>(reversedLines));
        calculateTotals(reverseEntry);
        if (!reverseEntry.isBalanced()) {
            throw new ValidationException("Reversal journal entry must be balanced");
        }

        original.setStatus(PostingStatus.REVERSED);
        original.setUpdatedBy(CurrentUserContext.getUserId());

        journalEntryRepository.save(original);
        GlJournalEntry savedReverse = journalEntryRepository.save(reverseEntry);
        GlJournalEntryResponse postedReverse = postJournalEntryInternal(savedReverse.getId(), "REVERSE");

        return postedReverse;
    }

    @Override
    @Transactional
    public void cancelJournalEntry(UUID journalEntryId) {
        log.info("Cancelling GL journal entry {}", journalEntryId);
        GlJournalEntry existing = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        if (!existing.canEdit()) {
            throw new InvalidOperationException("Only DRAFT entries can be cancelled");
        }

        existing.setStatus(PostingStatus.CANCELLED);
        existing.setUpdatedBy(CurrentUserContext.getUserId());
        journalEntryRepository.save(existing);

    }

    @Override
    public void validateJournalEntry(GlJournalEntryRequest request) {
        JournalValidationUtil.validateRequest(request);
        calculateTotals(request);
        if (!request.hasDebitLine() || !request.hasCreditLine()) {
            throw new ValidationException("Journal entry must contain at least one debit and one credit line");
        }
    }

    @Override
    public String generateVoucherNo(UUID companyId, LocalDate voucherDate) {
        return voucherNumberGenerator.generateVoucherNo(companyId, voucherDate);
    }

    @Override
    public GlJournalEntryResponse getJournalById(UUID journalEntryId) {
        log.info("Retrieving GL journal entry {}", journalEntryId);
        GlJournalEntry existing = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));
        return journalEntryMapper.entityToResponse(existing);
    }

    @Override
    public com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse getJournalProfileById(UUID journalEntryId) {
        log.info("Retrieving GL journal entry profile {}", journalEntryId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        
        GlJournalEntry entry = journalEntryRepository.findProfileByIdAndCompanyId(journalEntryId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        Company company = entry.getCompany();
        FiscalYear fiscalYear = entry.getFiscalYear();
        AccountingPeriod period = entry.getAccountingPeriod();

        // 1. Master Info
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.GlJournalMasterDto master = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.GlJournalMasterDto.builder()
                .journalEntryId(entry.getId())
                .voucherNumber(entry.getVoucherNo())
                .voucherDate(entry.getVoucherDate())
                .referenceNumber(entry.getReferenceNo())
                .sourceModule(entry.getSourceModule() != null ? entry.getSourceModule().name() : null)
                .sourceDocumentId(entry.getSourceId())
                .narration(entry.getNarration())
                .status(entry.getStatus())
                .totalDebit(entry.getTotalDebit())
                .totalCredit(entry.getTotalCredit())
                .isBalanced(entry.isBalanced())
                .currency(company != null ? company.getBaseCurrency() : null)
                .exchangeRate(BigDecimal.ONE)
                .build();

        // 2. Company Info
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.CompanyInfoDto companyInfo = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.CompanyInfoDto.builder()
                .companyId(company != null ? company.getId() : null)
                .companyName(company != null ? company.getCompanyName() : null)
                .companyCode(company != null ? company.getCompanyCode() : null)
                .gstin(company != null ? company.getGstin() : null)
                .pan(null)
                .baseCurrency(company != null ? company.getBaseCurrency() : null)
                .build();

        // 3. Fiscal Info
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.FiscalInfoDto fiscalInfo = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.FiscalInfoDto.builder()
                .fiscalYearId(fiscalYear != null ? fiscalYear.getId() : null)
                .fiscalYear(fiscalYear != null ? fiscalYear.getFiscalYear() : null)
                .accountingPeriodId(period != null ? period.getId() : null)
                .accountingPeriodName(period != null ? period.getPeriodName() : null)
                .periodStatus(period != null && period.getStatus() != null ? period.getStatus().name() : null)
                .build();

        // 4. Lines
        List<com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.GlJournalLineProfileDto> lineDtos = entry.getJournalLines().stream()
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                .map(l -> {
                    ChartOfAccount acc = l.getAccount();
                    return com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.GlJournalLineProfileDto.builder()
                            .journalLineId(l.getId())
                            .lineNumber(null)
                            .accountId(acc != null ? acc.getId() : null)
                            .accountCode(acc != null ? acc.getAccountCode() : null)
                            .accountName(acc != null ? acc.getAccountName() : null)
                            .accountGroup(acc != null && acc.getGroup() != null ? acc.getGroup().getName() : null)
                            .accountCategory(acc != null && acc.getGroup() != null && acc.getGroup().getCategory() != null ? acc.getGroup().getCategory().getName() : null)
                            .debitAmount(l.getDebitAmount())
                            .creditAmount(l.getCreditAmount())
                            .baseAmount(l.getDebitAmount() != null && l.getDebitAmount().compareTo(BigDecimal.ZERO) > 0 ? l.getDebitAmount() : l.getCreditAmount())
                            .currencyCode(l.getCurrencyCode() != null ? l.getCurrencyCode() : (company != null ? company.getBaseCurrency() : null))
                            .exchangeRate(l.getExchangeRate() != null ? l.getExchangeRate() : BigDecimal.ONE)
                            .costCenter(l.getCostCenterId() != null ? l.getCostCenterId().toString() : null)
                            .department(l.getDepartmentId() != null ? l.getDepartmentId().toString() : null)
                            .project(l.getProjectId() != null ? l.getProjectId().toString() : null)
                            .branch(l.getBranchId() != null ? l.getBranchId().toString() : null)
                            .description(l.getLineDescription())
                            .createdAt(l.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        // 5. Ledger Info
        List<com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.LedgerInfoDto> ledgerInfos = entry.getJournalLines().stream()
                .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()) && l.getAccount() != null)
                .map(GlJournalLine::getAccount)
                .distinct()
                .map(acc -> {
                    BigDecimal balance = acc.getOpeningBalance() != null ? acc.getOpeningBalance() : BigDecimal.ZERO;
                    return com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.LedgerInfoDto.builder()
                            .accountId(acc.getId())
                            .accountCode(acc.getAccountCode())
                            .accountName(acc.getAccountName())
                            .currentBalance(balance)
                            .openingBalance(balance)
                            .closingBalance(balance)
                            .accountType(acc.getAccountType() != null ? acc.getAccountType().name() : null)
                            .postingAllowed(acc.getPostingAllowed())
                            .build();
                })
                .collect(Collectors.toList());

        // 6. Source Transaction
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.SourceTransactionDto sourceTx = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.SourceTransactionDto.builder()
                .sourceModule(entry.getSourceModule() != null ? entry.getSourceModule().name() : null)
                .sourceNumber(entry.getReferenceNo())
                .build();

        // 7. Approval Info
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.ApprovalInfoDto approvalInfo = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.ApprovalInfoDto.builder()
                .approvalStatus(entry.getStatus().name())
                .build();

        // 8. Posting Info
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.PostingInfoDto postingInfo = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.PostingInfoDto.builder()
                .postedBy(entry.getPostedBy())
                .postedAt(entry.getPostedAt())
                .postingStatus(entry.getStatus())
                .build();

        // 9. Hash/Audit Info
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.HashAuditInfoDto hashInfo = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.HashAuditInfoDto.builder()
                .hashValue(entry.getHashValue())
                .previousHash(entry.getPreviousHash())
                .hashAlgorithm(entry.getHashAlgorithm())
                .createdBy(entry.getCreatedBy())
                .createdAt(entry.getCreatedAt())
                .updatedBy(entry.getUpdatedBy())
                .updatedAt(entry.getUpdatedAt())
                .build();

        // 10. Statistics
        com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.JournalStatisticsDto stats = com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.JournalStatisticsDto.builder()
                .lineCount(entry.getLineCount())
                .debitLineCount(entry.getDebitLineCount())
                .creditLineCount(entry.getCreditLineCount())
                .totalDebit(entry.getTotalDebit())
                .totalCredit(entry.getTotalCredit())
                .difference((entry.getTotalDebit() != null && entry.getTotalCredit() != null) ? entry.getTotalDebit().subtract(entry.getTotalCredit()).abs() : BigDecimal.ZERO)
                .isBalanced(entry.isBalanced())
                .build();

        // 12. Audit Trail
        List<AuditLog> logs = auditLogRepository.findByEntityNameAndEntityIdOrderByPerformedAtDesc("GlJournalEntry", journalEntryId);
        List<com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.AuditTrailDto> trail = logs.stream()
                .map(l -> com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.AuditTrailDto.builder()
                        .action(l.getActionType())
                        .performedBy(l.getPerformedBy())
                        .performedAt(l.getPerformedAt())
                        .details(l.getNewValue() != null ? l.getNewValue().toString() : null)
                        .build())
                .collect(Collectors.toList());

        return com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse.builder()
                .journalEntry(master)
                .company(companyInfo)
                .fiscalInformation(fiscalInfo)
                .journalLines(lineDtos)
                .ledgerInformation(ledgerInfos)
                .sourceTransaction(sourceTx)
                .approvalInformation(approvalInfo)
                .postingInformation(postingInfo)
                .hashInformation(hashInfo)
                .attachments(new ArrayList<>())
                .statistics(stats)
                .auditTrail(trail)
                .build();
    }

    @Override
    public GlJournalEntryResponse getJournalByVoucherNo(UUID companyId, String voucherNo) {
        log.info("Retrieving GL journal entry by voucher no {}", voucherNo);
        return journalEntryRepository.findByVoucherNoAndCompanyIdAndIsDeletedFalse(voucherNo, companyId)
                .map(journalEntryMapper::entityToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found for voucher number"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GlJournalEntryListResponse> getAllJournals(GlJournalEntryFilterDto filter, Pageable pageable) {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());
        log.info("Fetching GL journal entries");
        
        Specification<GlJournalEntry> spec = GlJournalEntrySpecification.getFilterSpecification(filter, resolvedCompanyId);
        Page<GlJournalEntry> page = journalEntryRepository.findAll(spec, pageable);
        
        return page.map(journalEntryMapper::entityToListResponse);
    }

    @Override
    public Page<GeneralLedgerLine> getAccountLedger(UUID companyId, UUID accountId, LocalDate startDate,
            LocalDate endDate, Pageable pageable) {
           UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Getting general ledger for account {}", accountId);
        ChartOfAccount account = chartOfAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!account.getCompany().getId().equals(resolvedCompanyId)) {
            throw new ResourceNotFoundException("Account not found");
        }
        Page<GlJournalLine> lines = journalLineRepository.getAccountLedgerByDateRange(resolvedCompanyId, accountId, startDate, endDate,
                pageable);
        BigDecimal balance = account.getOpeningBalance() == null ? ZERO : account.getOpeningBalance();
        List<GeneralLedgerLine> ledgerLines = new ArrayList<>();
        for (GlJournalLine line : lines.getContent()) {
            BigDecimal debit = line.getDebitAmount() == null ? ZERO : line.getDebitAmount();
            BigDecimal credit = line.getCreditAmount() == null ? ZERO : line.getCreditAmount();
            balance = calculateNatureAwareBalance(account.getAccountType(), balance, debit, credit);
            ledgerLines.add(GeneralLedgerLine.builder()
                    .journalEntryId(line.getJournalEntry().getId())
                    .voucherNo(line.getJournalEntry().getVoucherNo())
                    .voucherDate(line.getJournalEntry().getVoucherDate())
                    .narration(line.getJournalEntry().getNarration())
                    .accountId(accountId)
                    .accountCode(account.getAccountCode())
                    .accountName(account.getAccountName())
                    .debitAmount(debit)
                    .creditAmount(credit)
                    .runningBalance(balance)
                    .build());
        }
        return new PageImpl<>(ledgerLines, pageable, lines.getTotalElements());
    }

    @Override
    public Page<TrialBalanceLine> getTrialBalance(UUID companyId, LocalDate startDate, LocalDate endDate,
            Pageable pageable) {
        final UUID finalCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Calculating trial balance for company {}", finalCompanyId);
        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.of(1900, 1, 1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();
        Page<GlJournalLineRepository.TrialBalanceProjection> projections = finalCompanyId == null
                ? journalLineRepository.aggregateTrialBalancePagedAllCompanies(effectiveStartDate, effectiveEndDate, pageable)
                : journalLineRepository.aggregateTrialBalancePaged(finalCompanyId, effectiveStartDate, effectiveEndDate, pageable);

        return projections.map(this::toTrialBalanceLine);
    }

    @Override
    public BalanceSheetReport getBalanceSheetData(UUID companyId, UUID fiscalYearId) {
        final UUID finalCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating balance sheet for company {} and fiscal year {}", finalCompanyId, fiscalYearId);
        FiscalYear fiscalYear = fiscalYearRepository.findById(fiscalYearId)
                .orElseThrow(() -> new ResourceNotFoundException("Fiscal year not found"));
        LocalDate startDate = fiscalYear.getStartDate();
        LocalDate endDate = fiscalYear.getEndDate();
        BigDecimal assets = ZERO;
        BigDecimal liabilities = ZERO;
        BigDecimal equity = ZERO;

        List<GlJournalLineRepository.TrialBalanceProjection> projections = getAggregateBalances(finalCompanyId, startDate, endDate);
        for (GlJournalLineRepository.TrialBalanceProjection projection : projections) {
            BigDecimal balance = calculateProjectionClosingBalance(projection);
            String acctType = projection.getCategoryCode();
            if (containsCategory(acctType, "AST")) {
                assets = assets.add(balance);
            } else if (containsCategory(acctType, "LIA")) {
                liabilities = liabilities.add(balance);
            } else if (containsCategory(acctType, "EQT")) {
                equity = equity.add(balance);
            }
        }

        return BalanceSheetReport.builder()
                .totalAssets(assets)
                .totalLiabilities(liabilities)
                .totalEquity(equity)
                .totalAssetsAndEquity(assets.add(liabilities).add(equity))
                .build();
    }

    @Override
    public ProfitLossReport getProfitLossData(UUID companyId, UUID fiscalYearId) {
        final UUID finalCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating profit and loss for company {} and fiscal year {}", finalCompanyId, fiscalYearId);
        FiscalYear fiscalYear = fiscalYearRepository.findById(fiscalYearId)
                .orElseThrow(() -> new ResourceNotFoundException("Fiscal year not found"));
        LocalDate startDate = fiscalYear.getStartDate();
        LocalDate endDate = fiscalYear.getEndDate();
        BigDecimal income = ZERO;
        BigDecimal expenses = ZERO;
        List<GlJournalLineRepository.TrialBalanceProjection> projections = getAggregateBalances(finalCompanyId, startDate, endDate);
        for (GlJournalLineRepository.TrialBalanceProjection projection : projections) {
            BigDecimal debit = safe(projection.getPeriodDebit());
            BigDecimal credit = safe(projection.getPeriodCredit());
            String acctType = projection.getCategoryCode();
            if (containsCategory(acctType, "INC")) {
                income = income.add(credit).subtract(debit);
            } else if (containsCategory(acctType, "EXP")) {
                expenses = expenses.add(debit).subtract(credit);
            }
        }

        return ProfitLossReport.builder()
                .totalIncome(income)
                .totalExpenses(expenses)
                .netProfitOrLoss(income.subtract(expenses))
                .build();
    }

    @Override
    public GlJournalEntryResponse createAutoJournal(GlJournalEntryRequest request) {
        if (request.getSourceModule() == null) {
            request.setSourceModule(SourceModule.MANUAL);
        }
            // For programmatic creation, allow caller to pass sourceModule/sourceId via request
            // Route through the service create method using current company context
            UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
            return createJournalEntry(RequestWrapper.of(request), companyId);
    }

    @Override
    public void validateBalancedEntry(GlJournalEntryRequest request) {
        calculateTotals(request);
        if (request.getJournalLines() == null) {
            throw new ValidationException("Journal entry has no lines");
        }
        BigDecimal totalDebit = request.getJournalLines().stream()
                .map(line -> line.getDebitAmount() == null ? ZERO : line.getDebitAmount())
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalCredit = request.getJournalLines().stream()
                .map(line -> line.getCreditAmount() == null ? ZERO : line.getCreditAmount())
                .reduce(ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new ValidationException("Journal entry is not balanced");
        }
    }

    private FiscalYear resolveFiscalYear(Company company, GlJournalEntryRequest request) {
        if (request.getFiscalYearId() != null) {
            return fiscalYearRepository.findById(request.getFiscalYearId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fiscal year not found"));
        }
        return fiscalYearRepository.findByCompanyId(company.getId()).stream()
                .filter(fiscalYear -> request.getVoucherDate() != null && fiscalYear.getStartDate() != null
                        && fiscalYear.getEndDate() != null)
                .filter(fiscalYear -> !request.getVoucherDate().isBefore(fiscalYear.getStartDate())
                        && !request.getVoucherDate().isAfter(fiscalYear.getEndDate()))
                .findFirst()
                .orElseThrow(() -> new ValidationException("Unable to resolve fiscal year for voucher date"));
    }

    private AccountingPeriod resolveAccountingPeriod(Company company, FiscalYear fiscalYear,
            GlJournalEntryRequest request) {
        if (request.getAccountingPeriodId() != null) {
            return accountingPeriodRepository.findById(request.getAccountingPeriodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Accounting period not found"));
        }
        return accountingPeriodRepository.findAllByCompanyIdAndFiscalYearId(company.getId(), fiscalYear.getId()).stream()
                .filter(period -> request.getVoucherDate() != null && period.getStartDate() != null
                        && period.getEndDate() != null)
                .filter(period -> !request.getVoucherDate().isBefore(period.getStartDate())
                        && !request.getVoucherDate().isAfter(period.getEndDate()))
                .findFirst()
                .orElseThrow(() -> new ValidationException("Unable to resolve accounting period for voucher date"));
    }

    private GlJournalLine buildJournalLine(GlJournalLineRequest request,
            GlJournalEntry journalEntry, Company company) {
        ChartOfAccount account = chartOfAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!company.getId().equals(account.getCompany().getId())) {
            throw new ValidationException("Journal line account does not belong to the journal company");
        }
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new ValidationException("Account is inactive: " + account.getAccountCode());
        }
        if (!Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new ValidationException("Posting not allowed for account: " + account.getAccountCode());
        }
        if (Boolean.TRUE.equals(account.getIsDeleted())) {
            throw new ValidationException("Deleted account cannot be used: " + account.getAccountCode());
        }

        if ((request.getCurrencyCode() != null && !request.getCurrencyCode().trim().isEmpty()) &&
                (request.getExchangeRate() == null || request.getExchangeRate().compareTo(java.math.BigDecimal.ZERO) <= 0)) {
            throw new ValidationException("Foreign currency journal lines require an exchange rate");
        }

        GlJournalLine line = journalLineMapper.requestToEntity(request);
        line.setCompany(company);
        line.setJournalEntry(journalEntry);
        line.setAccount(account);
        return line;
    }

    private void calculateTotals(GlJournalEntry journalEntry) {
        BigDecimal totalDebit = journalEntry.getJournalLines().stream()
                .map(line -> line.getDebitAmount() == null ? ZERO : line.getDebitAmount())
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getJournalLines().stream()
                .map(line -> line.getCreditAmount() == null ? ZERO : line.getCreditAmount())
                .reduce(ZERO, BigDecimal::add);
        journalEntry.setTotalDebit(totalDebit);
        journalEntry.setTotalCredit(totalCredit);
    }

    private void calculateTotals(GlJournalEntryRequest request) {
        BigDecimal totalDebit = request.getJournalLines().stream()
                .map(line -> line.getDebitAmount() == null ? ZERO : line.getDebitAmount())
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalCredit = request.getJournalLines().stream()
                .map(line -> line.getCreditAmount() == null ? ZERO : line.getCreditAmount())
                .reduce(ZERO, BigDecimal::add);
        request.getJournalLines().forEach(line -> {
            if (line.getDebitAmount() == null) {
                line.setDebitAmount(ZERO);
            }
            if (line.getCreditAmount() == null) {
                line.setCreditAmount(ZERO);
            }
        });
    }

    private TrialBalanceLine toTrialBalanceLine(GlJournalLineRepository.TrialBalanceProjection projection) {
        BigDecimal openingBalance = calculateProjectionOpeningBalance(projection);
        BigDecimal debitAmount = safe(projection.getPeriodDebit());
        BigDecimal creditAmount = safe(projection.getPeriodCredit());
        BigDecimal closingBalance = calculateNatureAwareBalance(projection.getAccountType(), openingBalance, debitAmount, creditAmount);

        return TrialBalanceLine.builder()
                .accountId(UUID.fromString(projection.getAccountId()))
                .accountCode(projection.getAccountCode())
                .accountName(projection.getAccountName())
                .accountNature(projection.getAccountType())
                .openingBalance(openingBalance)
                .debitAmount(debitAmount)
                .creditAmount(creditAmount)
                .closingBalance(closingBalance)
                .build();
    }

    private List<GlJournalLineRepository.TrialBalanceProjection> getAggregateBalances(UUID companyId, LocalDate startDate, LocalDate endDate) {
        LocalDate effectiveStartDate = startDate != null ? startDate : LocalDate.of(1900, 1, 1);
        LocalDate effectiveEndDate = endDate != null ? endDate : LocalDate.now();
        return companyId == null
                ? journalLineRepository.aggregateTrialBalanceAllCompanies(effectiveStartDate, effectiveEndDate)
                : journalLineRepository.aggregateTrialBalance(companyId, effectiveStartDate, effectiveEndDate);
    }

    private BigDecimal calculateProjectionOpeningBalance(GlJournalLineRepository.TrialBalanceProjection projection) {
        return calculateNatureAwareBalance(
                projection.getAccountType(),
                safe(projection.getOpeningBalance()),
                safe(projection.getOpeningDebit()),
                safe(projection.getOpeningCredit()));
    }

    private BigDecimal calculateProjectionClosingBalance(GlJournalLineRepository.TrialBalanceProjection projection) {
        return calculateNatureAwareBalance(
                projection.getAccountType(),
                calculateProjectionOpeningBalance(projection),
                safe(projection.getPeriodDebit()),
                safe(projection.getPeriodCredit()));
    }

    private BigDecimal calculateNatureAwareBalance(AccountNature accountNature, BigDecimal opening, BigDecimal debit, BigDecimal credit) {
        if (AccountNature.CREDIT == accountNature) {
            return safe(opening).add(safe(credit)).subtract(safe(debit));
        }
        return safe(opening).add(safe(debit)).subtract(safe(credit));
    }

    private BigDecimal calculateNatureAwareBalance(String accountNature, BigDecimal opening, BigDecimal debit, BigDecimal credit) {
        if (AccountNature.CREDIT.name().equalsIgnoreCase(accountNature)) {
            return safe(opening).add(safe(credit)).subtract(safe(debit));
        }
        return safe(opening).add(safe(debit)).subtract(safe(credit));
    }

    private boolean containsCategory(String accountCategory, String expectedCode) {
        return accountCategory != null && accountCategory.toUpperCase().contains(expectedCode);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private BigDecimal getTotalDebitForRange(UUID companyId, UUID accountId, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return (BigDecimal) Optional.ofNullable(journalLineRepository.getTotalDebitForAccountByDateRange(companyId, accountId, startDate, endDate))
                    .orElse(ZERO);
        }
        return Optional.ofNullable(journalLineRepository.getTotalDebitForAccount(companyId, accountId)).orElse(ZERO);
    }

    private BigDecimal getTotalCreditForRange(UUID companyId, UUID accountId, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return (BigDecimal) Optional.ofNullable(journalLineRepository.getTotalCreditForAccountByDateRange(companyId, accountId, startDate, endDate))
                    .orElse(ZERO);
        }
        return Optional.ofNullable(journalLineRepository.getTotalCreditForAccount(companyId, accountId)).orElse(ZERO);
    }

    private void updateBalanceSnapshots(GlJournalEntry postedEntry) {
        if (postedEntry == null || postedEntry.getJournalLines() == null) {
            return;
        }

        UUID companyId = postedEntry.getCompany() != null ? postedEntry.getCompany().getId() : null;
        UUID fiscalYearId = postedEntry.getFiscalYear() != null ? postedEntry.getFiscalYear().getId() : null;
        UUID accountingPeriodId = postedEntry.getAccountingPeriod() != null ? postedEntry.getAccountingPeriod().getId() : null;

        postedEntry.getJournalLines().stream()
                .filter(line -> !Boolean.TRUE.equals(line.getIsDeleted()))
                .filter(line -> line.getAccount() != null)
                .map(line -> line.getAccount().getId())
                .distinct()
                .forEach(accountId -> {
                    List<GlJournalLine> postedLines = journalLineRepository.findPostedLinesForAccountContext(
                            companyId,
                            accountId,
                            fiscalYearId,
                            accountingPeriodId);

                    BigDecimal totalDebit = postedLines.stream()
                            .map(line -> line.getDebitAmount() == null ? ZERO : line.getDebitAmount())
                            .reduce(ZERO, BigDecimal::add);
                    BigDecimal totalCredit = postedLines.stream()
                            .map(line -> line.getCreditAmount() == null ? ZERO : line.getCreditAmount())
                            .reduce(ZERO, BigDecimal::add);

                    BalanceSnapshot snapshot = balanceSnapshotRepository
                            .findByCompanyIdAndAccountIdAndFiscalYearIdAndAccountingPeriodIdAndIsDeletedFalse(
                                    companyId,
                                    accountId,
                                    fiscalYearId,
                                    accountingPeriodId)
                            .orElseGet(() -> BalanceSnapshot.builder()
                                    .company(postedEntry.getCompany())
                                    .account(chartOfAccountRepository.findById(accountId)
                                            .orElseThrow(() -> new ResourceNotFoundException("Account not found")))
                                    .fiscalYear(postedEntry.getFiscalYear())
                                    .accountingPeriod(postedEntry.getAccountingPeriod())
                                    .openingBalance(ZERO)
                                    .build());

                    snapshot.setSnapshotDate(postedEntry.getVoucherDate());
                    snapshot.setDebitAmount(totalDebit);
                    snapshot.setCreditAmount(totalCredit);
                    snapshot.setClosingBalance(Optional.ofNullable(snapshot.getOpeningBalance()).orElse(ZERO)
                            .add(totalDebit)
                            .subtract(totalCredit));
                    balanceSnapshotRepository.save(snapshot);
                });
    }

    private String getPreviousHash(Company company) {
        return journalEntryRepository
                .findTopByCompanyIdAndStatusInAndIsDeletedFalseOrderByCreatedAtDesc(company.getId(),
                        Arrays.asList(PostingStatus.POSTED, PostingStatus.REVERSED))
                .map(GlJournalEntry::getHashValue)
                .orElse(JournalConstants.GENESIS_HASH);
    }

    private String generateHash(GlJournalEntry journalEntry, String previousHash) {
        return JournalHashUtil.calculateEntryHash(
                journalEntry.getVoucherNo(),
                journalEntry.getVoucherDate() != null ? journalEntry.getVoucherDate().toString() : null,
                journalEntry.getTotalDebit() != null ? journalEntry.getTotalDebit().toPlainString() : null,
                journalEntry.getTotalCredit() != null ? journalEntry.getTotalCredit().toPlainString() : null,
                previousHash);
    }

    private void createAuditLog(GlJournalEntry oldEntry, GlJournalEntry newEntry, String actionType) {
        ObjectNode oldVal = objectMapper.createObjectNode();
        if (oldEntry != null) {
            if (oldEntry.getVoucherNo() != null) {
                oldVal.put("voucherNo", oldEntry.getVoucherNo());
            }
            if (oldEntry.getStatus() != null) {
                oldVal.put("status", oldEntry.getStatus().toString());
            }
        }

        ObjectNode newVal = objectMapper.createObjectNode();
        if (newEntry != null) {
            if (newEntry.getVoucherNo() != null) {
                newVal.put("voucherNo", newEntry.getVoucherNo());
            }
            if (newEntry.getStatus() != null) {
                newVal.put("status", newEntry.getStatus().toString());
            }
        }

        AuditLog audit = AuditLog.builder()
                .company(newEntry != null ? newEntry.getCompany() : oldEntry != null ? oldEntry.getCompany() : null)
                .entityName("GlJournalEntry")
                .entityId(newEntry != null ? newEntry.getId() : oldEntry != null ? oldEntry.getId() : null)
                .actionType(actionType)
                .oldValue(oldVal)
                .newValue(newVal)
                .performedBy(CurrentUserContext.getUserId())
                .performedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);
    }

    private GlJournalEntryResponse postJournalEntryInternal(UUID journalEntryId, String actionType) {
        log.info("Posting GL journal entry {}", journalEntryId);
        GlJournalEntry existing = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        if (!existing.canPost()) {
            throw new InvalidOperationException("Only DRAFT entries can be posted");
        }

        long activeLines = existing.getJournalLines().stream()
                .filter(line -> !Boolean.TRUE.equals(line.getIsDeleted()))
                .count();
        if (activeLines < 2) {
            throw new ValidationException("Journal entry must have at least 2 valid lines to be posted");
        }

        if (!existing.isBalanced()) {
            throw new ValidationException("Cannot post unbalanced journal entry");
        }

        if (existing.getVoucherDate().isAfter(LocalDate.now())) {
            throw new ValidationException("Voucher date cannot be in the future");
        }

        if (Boolean.TRUE.equals(existing.getFiscalYear().getIsClosed())) {
            throw new ValidationException("Cannot post entry in a closed fiscal year");
        }

        if (existing.getAccountingPeriod().getStatus() == com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.CLOSED
                || existing.getAccountingPeriod().getStatus() == com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.LOCKED) {
            throw new ValidationException("Cannot post entry in a closed accounting period");
        }

        if (!StringUtils.hasText(existing.getVoucherNo())) {
            existing.setVoucherNo(voucherNumberGenerator.generateVoucherNo(existing.getCompany().getId(), existing.getVoucherDate()));
        }

        String previousHash = getPreviousHash(existing.getCompany());
        existing.setPreviousHash(previousHash);
        existing.setHashValue(generateHash(existing, previousHash));
        existing.setHashAlgorithm(JournalConstants.JOURNAL_HASH_ALGORITHM);
        existing.setPostedAt(LocalDateTime.now());
        existing.setPostedBy(CurrentUserContext.getUserId());
        existing.setStatus(PostingStatus.POSTED);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        GlJournalEntry posted = journalEntryRepository.save(existing);
        updateBalanceSnapshots(posted);

        return journalEntryMapper.entityToResponse(posted);
    }
}
