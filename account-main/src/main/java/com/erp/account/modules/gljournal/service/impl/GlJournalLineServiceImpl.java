package com.erp.account.modules.gljournal.service.impl;

import com.erp.account.modules.gljournal.dto.response.GlJournalLineResponse;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineFilterDto;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.AccountNotFoundException;
import com.erp.account.common.exception.InvalidAmountException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.gljournal.mapper.GlJournalLineMapper;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.specification.GlJournalLineSpecification;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import org.springframework.util.StringUtils;
import com.erp.account.util.TenantUtils;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.gljournal.service.GlJournalLineService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class GlJournalLineServiceImpl implements GlJournalLineService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final GlJournalLineRepository journalLineRepository;
    private final GlJournalEntryRepository journalEntryRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final GlJournalLineMapper mapper;

    @Override
    @Transactional
    public GlJournalLineResponse createLine(UUID journalEntryId, RequestWrapper<GlJournalLineRequest> requestWrapper) {
        GlJournalLineRequest request = requestWrapper.unwrap();

        GlJournalEntry journal = loadDraftJournalEntry(journalEntryId);
        validateLine(request, journal.getCompany().getBaseCurrency());
        ChartOfAccount account = validatePostingAccount(request.getAccountId(), journal);
        
        normalizeCurrencyFields(request);
        if (!requestIsValid(request)) {
            throw new ValidationException("Journal line must have exactly one positive amount");
        }

        GlJournalLine line = mapper.requestToEntity(request);
        line.setJournalEntry(journal);
        line.setCompany(journal.getCompany());
        line.setAccount(account);

        GlJournalLine saved = journalLineRepository.save(line);

        recalculateJournalTotals(journalEntryId);

        return mapper.entityToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GlJournalLineResponse> getAllLines(GlJournalLineFilterDto filter, Pageable pageable) {
        log.info("Retrieving all journal lines with filters for company");
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Specification<GlJournalLine> spec = GlJournalLineSpecification.getFilterSpecification(filter, companyId);
        Page<GlJournalLine> pageResult = journalLineRepository.findAll(spec, pageable);
        return pageResult.map(mapper::entityToResponse);
    }

    @Override
    @Transactional
    public GlJournalLineResponse updateLine(UUID id, RequestWrapper<GlJournalLineRequest> requestWrapper) {
        GlJournalLineRequest request = requestWrapper.unwrap();

        GlJournalLine existing = journalLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal line not found"));

        GlJournalEntry journal = loadDraftJournalEntry(existing.getJournalEntry().getId());
        validateLine(request, journal.getCompany().getBaseCurrency());

        ChartOfAccount account = validatePostingAccount(request.getAccountId(), journal);
        
        normalizeCurrencyFields(request);
        if (!requestIsValid(request)) {
            throw new ValidationException("Journal line must have exactly one positive amount");
        }

        mapper.updateEntityFromRequest(request, existing);
        existing.setAccount(account);
        GlJournalLine updated = journalLineRepository.save(existing);

        recalculateJournalTotals(journal.getId());
        return mapper.entityToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteLine(UUID id) {
        GlJournalLine existing = journalLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal line not found"));

        GlJournalEntry journal = loadDraftJournalEntry(existing.getJournalEntry().getId());

        existing.setIsDeleted(true);
        journalLineRepository.save(existing);
        recalculateJournalTotals(journal.getId());
    }

    @Override
    public void validateLine(GlJournalLineRequest request, String baseCurrency) {
        if (request == null)
            throw new ValidationException("Line request cannot be null");

        BigDecimal debit = request.getDebitAmount() == null ? ZERO : request.getDebitAmount();
        BigDecimal credit = request.getCreditAmount() == null ? ZERO : request.getCreditAmount();

        if (debit.compareTo(BigDecimal.ZERO) < 0 || credit.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidAmountException("Negative amounts are not allowed");
        }
        if (!requestIsValid(request)) {
            throw new InvalidAmountException("Either debit or credit must be greater than zero, but not both");
        }
        
        if (StringUtils.hasText(request.getCurrencyCode())) {
            if (request.getCurrencyCode().equalsIgnoreCase(baseCurrency)) {
                if (request.getExchangeRate() != null) {
                    throw new ValidationException("Exchange rate must not be provided for base currency lines");
                }
            } else {
                if (request.getExchangeRate() == null) {
                    throw new ValidationException("Foreign currency lines require an exchange rate");
                }
                if (request.getExchangeRate().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ValidationException("Exchange rate must be greater than zero for foreign currency lines");
                }
            }
        } else {
            if (request.getExchangeRate() != null) {
                throw new ValidationException("Exchange rate must not be provided for base currency lines");
            }
        }
    }

    private void normalizeCurrencyFields(GlJournalLineRequest request) {
        if (!StringUtils.hasText(request.getCurrencyCode())) {
            request.setCurrencyCode(null);
            request.setExchangeRate(null);
        }
    }

    private boolean requestIsValid(GlJournalLineRequest request) {
        if (request == null) {
            return false;
        }
        BigDecimal debit = request.getDebitAmount() == null ? BigDecimal.ZERO : request.getDebitAmount();
        BigDecimal credit = request.getCreditAmount() == null ? BigDecimal.ZERO : request.getCreditAmount();
        boolean debitPositive = debit.compareTo(BigDecimal.ZERO) > 0;
        boolean creditPositive = credit.compareTo(BigDecimal.ZERO) > 0;
        return debitPositive ^ creditPositive;
    }

    private GlJournalEntry loadDraftJournalEntry(UUID journalEntryId) {
        GlJournalEntry journal = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));

        if (!TenantUtils.isSystemAdmin() && !TenantUtils.getCurrentCompanyId().equals(journal.getCompany().getId())) {
            throw new ResourceNotFoundException("Journal entry not found");
        }

        if (!journal.canEdit()) {
            throw new ValidationException("Only DRAFT journal entries can be modified");
        }
        if (Boolean.TRUE.equals(journal.getIsDeleted())) {
            throw new ValidationException("Cannot add or modify lines on a deleted journal entry");
        }
        return journal;
    }

    private ChartOfAccount validatePostingAccount(UUID accountId, GlJournalEntry journal) {
        if (accountId == null) {
            throw new ValidationException("Account is required for journal line posting");
        }
        ChartOfAccount account = chartOfAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(accountId, journal.getCompany().getId())
                .orElseThrow(() -> new AccountNotFoundException("Account not found"));
        if (Boolean.TRUE.equals(account.getIsDeleted())) {
            throw new ValidationException("Deleted account cannot be posted to");
        }
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new ValidationException("Inactive account cannot be posted to");
        }
        if (!Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new ValidationException("Posting is not allowed for this account");
        }
        return account;
    }



    @Override
    public GlJournalLineResponse getLineById(UUID id) {
        GlJournalLine line = journalLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal line not found"));
        return mapper.entityToResponse(line);
    }

    @Override
    public com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse getLineProfileById(UUID id) {
        GlJournalLine line = journalLineRepository.findProfileByIdAndCompanyId(id, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal line not found"));

        GlJournalEntry journal = line.getJournalEntry();
        com.erp.account.modules.company.entity.Company company = line.getCompany();
        ChartOfAccount account = line.getAccount();
        com.erp.account.modules.fiscalyear.entity.FiscalYear fiscalYear = journal != null ? journal.getFiscalYear() : null;
        com.erp.account.modules.accountingperiod.entity.AccountingPeriod period = journal != null ? journal.getAccountingPeriod() : null;

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.JournalLineDto lineDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.JournalLineDto.builder()
                .journalLineId(line.getId())
                .lineNumber(null)
                .voucherNumber(journal != null ? journal.getVoucherNo() : null)
                .voucherDate(journal != null ? journal.getVoucherDate() : null)
                .lineDescription(line.getLineDescription())
                .debitAmount(line.getDebitAmount())
                .creditAmount(line.getCreditAmount())
                .baseAmount(line.getBaseAmount())
                .currencyCode(line.getCurrencyCode() != null ? line.getCurrencyCode() : (company != null ? company.getBaseCurrency() : null))
                .exchangeRate(line.getExchangeRate() != null ? line.getExchangeRate() : BigDecimal.ONE)
                .isDeleted(line.getIsDeleted())
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.JournalEntryDto journalDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.JournalEntryDto.builder()
                .journalEntryId(journal != null ? journal.getId() : null)
                .voucherNumber(journal != null ? journal.getVoucherNo() : null)
                .voucherDate(journal != null ? journal.getVoucherDate() : null)
                .referenceNumber(journal != null ? journal.getReferenceNo() : null)
                .narration(journal != null ? journal.getNarration() : null)
                .sourceModule(journal != null && journal.getSourceModule() != null ? journal.getSourceModule().name() : null)
                .sourceDocumentId(journal != null ? journal.getSourceId() : null)
                .journalStatus(journal != null && journal.getStatus() != null ? journal.getStatus().name() : null)
                .totalDebit(journal != null ? journal.getTotalDebit() : null)
                .totalCredit(journal != null ? journal.getTotalCredit() : null)
                .isBalanced(journal != null ? journal.isBalanced() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.CompanyDto companyDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.CompanyDto.builder()
                .companyId(company != null ? company.getId() : null)
                .companyName(company != null ? company.getCompanyName() : null)
                .companyCode(company != null ? company.getCompanyCode() : null)
                .gstin(company != null ? company.getGstin() : null)
                .baseCurrency(company != null ? company.getBaseCurrency() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.AccountDto accountDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.AccountDto.builder()
                .accountId(account != null ? account.getId() : null)
                .accountCode(account != null ? account.getAccountCode() : null)
                .accountName(account != null ? account.getAccountName() : null)
                .accountGroup(account != null && account.getGroup() != null ? account.getGroup().getName() : null)
                .accountCategory(account != null && account.getGroup() != null && account.getGroup().getCategory() != null ? account.getGroup().getCategory().getName() : null)
                .accountType(account != null && account.getAccountType() != null ? account.getAccountType().name() : null)
                .postingAllowed(account != null ? account.getPostingAllowed() : null)
                .currentBalance(account != null ? account.getOpeningBalance() : null)
                .openingBalance(account != null ? account.getOpeningBalance() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.LedgerDto ledgerDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.LedgerDto.builder()
                .ledgerName(account != null ? account.getAccountName() : null)
                .ledgerBalance(account != null ? account.getOpeningBalance() : null)
                .ledgerType(account != null && account.getAccountType() != null ? account.getAccountType().name() : null)
                .lastTransactionDate(journal != null ? journal.getVoucherDate() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.FiscalInfoDto fiscalDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.FiscalInfoDto.builder()
                .fiscalYear(fiscalYear != null ? fiscalYear.getFiscalYear() : null)
                .accountingPeriod(period != null ? period.getPeriodName() : null)
                .periodStatus(period != null && period.getStatus() != null ? period.getStatus().name() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.SourceTransactionDto sourceDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.SourceTransactionDto.builder()
                .sourceModule(journal != null && journal.getSourceModule() != null ? journal.getSourceModule().name() : null)
                .sourceDocumentNumber(journal != null ? journal.getReferenceNo() : null)
                .sourceStatus(journal != null && journal.getStatus() != null ? journal.getStatus().name() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.CostAllocationDto costDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.CostAllocationDto.builder()
                .costCenter(line.getCostCenterId() != null ? line.getCostCenterId().toString() : null)
                .department(line.getDepartmentId() != null ? line.getDepartmentId().toString() : null)
                .project(line.getProjectId() != null ? line.getProjectId().toString() : null)
                .branch(line.getBranchId() != null ? line.getBranchId().toString() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.ApprovalInfoDto approvalDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.ApprovalInfoDto.builder()
                .approvalStatus(journal != null && journal.getStatus() != null ? journal.getStatus().name() : null)
                .approvedBy(null)
                .approvedDate(null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.PostingInfoDto postingDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.PostingInfoDto.builder()
                .postedBy(journal != null ? journal.getPostedBy() : null)
                .postedAt(journal != null ? journal.getPostedAt() : null)
                .postingStatus(journal != null && journal.getStatus() != null ? journal.getStatus().name() : null)
                .build();

        com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.AuditDto auditDto = com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.AuditDto.builder()
                .createdBy(line.getCreatedBy())
                .createdAt(line.getCreatedAt())
                .updatedBy(line.getUpdatedBy())
                .updatedAt(line.getUpdatedAt())
                .build();

        return com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse.builder()
                .journalLine(lineDto)
                .journalEntry(journalDto)
                .company(companyDto)
                .account(accountDto)
                .ledger(ledgerDto)
                .fiscalInformation(fiscalDto)
                .sourceTransaction(sourceDto)
                .costAllocation(costDto)
                .approvalInformation(approvalDto)
                .postingInformation(postingDto)

                .build();
    }

    @Override
    public Page<GlJournalLineResponse> getLinesByJournal(UUID journalEntryId, Pageable pageable) {
        Page<GlJournalLine> page = journalLineRepository.findByJournalEntryIdAndIsDeletedFalse(journalEntryId,
                pageable);
        return page.map(mapper::entityToResponse);
    }

    @Override
    public Page<GlJournalLineResponse> getAccountTransactions(UUID accountId, Pageable pageable) {
        Page<GlJournalLine> page = journalLineRepository.findByAccountIdAndCompanyIdAndIsDeletedFalse(accountId, TenantUtils.getCurrentCompanyId(), pageable);
        return page.map(mapper::entityToResponse);
    }

    @Override
    public BigDecimal calculateDebitTotal(UUID accountId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return java.util.Optional.ofNullable(journalLineRepository.getTotalDebitForAccount(companyId, accountId))
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal calculateCreditTotal(UUID accountId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return java.util.Optional.ofNullable(journalLineRepository.getTotalCreditForAccount(companyId, accountId))
                .orElse(BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public long recalculateJournalTotals(UUID journalEntryId) {
        GlJournalEntry journal = journalEntryRepository.findByIdAndCompanyIdAndIsDeletedFalse(journalEntryId, TenantUtils.getCurrentCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found"));
        List<GlJournalLine> lines = journalLineRepository.findByJournalEntryAndIsDeletedFalse(journal);

        BigDecimal totalDebit = lines.stream().map(l -> l.getDebitAmount() == null ? ZERO : l.getDebitAmount())
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalCredit = lines.stream().map(l -> l.getCreditAmount() == null ? ZERO : l.getCreditAmount())
                .reduce(ZERO, BigDecimal::add);

        boolean changed = false;
        if (journal.getTotalDebit() == null || journal.getTotalDebit().compareTo(totalDebit) != 0) {
            journal.setTotalDebit(totalDebit);
            changed = true;
        }
        if (journal.getTotalCredit() == null || journal.getTotalCredit().compareTo(totalCredit) != 0) {
            journal.setTotalCredit(totalCredit);
            changed = true;
        }
        
        if (changed) {
            journalEntryRepository.save(journal);
        }
        return lines.size();
    }

    @Override
    public List<GlJournalLineResponse> getLedgerLines(UUID accountId, Pageable pageable) {
        Page<GlJournalLine> page = journalLineRepository.findByAccountIdAndCompanyIdAndIsDeletedFalse(accountId, TenantUtils.getCurrentCompanyId(), pageable);
        return page.getContent().stream().map(mapper::entityToResponse).collect(Collectors.toList());
    }
    
    // TODO: Implement copyJournalLines
    // TODO: Implement bulkCreate
    // TODO: Implement bulkDelete
    // TODO: Implement validateBalance
    // TODO: Implement renumberLines
    // TODO: Implement moveLine
    // TODO: Implement duplicateLine
}
