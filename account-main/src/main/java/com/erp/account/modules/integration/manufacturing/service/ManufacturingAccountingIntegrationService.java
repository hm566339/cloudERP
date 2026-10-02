package com.erp.account.modules.integration.manufacturing.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.integration.manufacturing.dto.ManufacturingJournalRequest;
import com.erp.account.modules.integration.manufacturing.dto.ManufacturingJournalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ManufacturingAccountingIntegrationService {
    private final CompanyRepository companyRepository;
    private final FiscalYearRepository fiscalYearRepository;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final GlJournalEntryRepository journalRepository;
    private final AccountingPostingService accountingPostingService;
        private final ChartOfAccountRepository chartOfAccountRepository;

    @Transactional
    public ManufacturingJournalResponse post(ManufacturingJournalRequest request) {
        validateContract(request);
        SourceModule sourceModule = SourceModule.MANUFACTURING;
        Company company = companyRepository.findByIdForUpdate(request.getCompanyId())
                .orElseThrow(() -> new BadRequestException("Company not found", "COMPANY_NOT_FOUND"));
        GlJournalEntry existing = journalRepository
                .findFirstByCompanyIdAndSourceModuleAndSourceIdAndEventTypeAndIsDeletedFalse(
                        request.getCompanyId(), sourceModule, request.getSourceId(), request.getEventType())
                .orElseGet(() -> journalRepository
                        .findFirstByCompanyIdAndSourceModuleAndIdempotencyKeyAndIsDeletedFalse(
                                request.getCompanyId(), sourceModule, request.getIdempotencyKey())
                        .orElse(null));
        if (existing != null) {
            return toResponse(existing);
        }
        FiscalYear fiscalYear = fiscalYearRepository.findByCompanyId(company.getId()).stream()
                .filter(year -> contains(year.getStartDate(), year.getEndDate(), request.getVoucherDate()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No fiscal year for voucher date", "FISCAL_YEAR_NOT_FOUND"));
        AccountingPeriod period = accountingPeriodRepository
                .findByCompanyIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        company.getId(), request.getVoucherDate(), request.getVoucherDate())
                .stream().findFirst()
                .orElseThrow(() -> new BadRequestException("No accounting period for voucher date", "ACCOUNTING_PERIOD_NOT_FOUND"));

        ChartOfAccount debitAccount = resolveAccount(request.getCompanyId(), request.getEventType(), true);
        ChartOfAccount creditAccount = resolveAccount(request.getCompanyId(), request.getEventType(), false);
        GlJournalEntryRequest journalRequest = GlJournalEntryRequest.builder()
                .voucherDate(request.getVoucherDate())
                .referenceNo(request.getReferenceNo())
                .narration(request.getNarration())
                .journalLines(java.util.List.of(
                        GlJournalLineRequest.builder().accountId(debitAccount.getId())
                                .debitAmount(request.getAmount()).currencyCode(request.getCurrencyCode())
                                .exchangeRate(java.math.BigDecimal.ONE).lineDescription(request.getEventType()).build(),
                        GlJournalLineRequest.builder().accountId(creditAccount.getId())
                                .creditAmount(request.getAmount()).currencyCode(request.getCurrencyCode())
                                .exchangeRate(java.math.BigDecimal.ONE).lineDescription(request.getEventType()).build()))
                .sourceModule(sourceModule)
                .sourceId(request.getSourceId())
                .eventType(request.getEventType())
                .idempotencyKey(request.getIdempotencyKey())
                .build();
        GlJournalEntry saved = accountingPostingService.postJournalEntry(
                journalRequest, company, fiscalYear, period, request.getVoucherDate(), null);
        return toResponse(saved);
    }

        private ChartOfAccount resolveAccount(UUID companyId, String eventType, boolean debit) {
                String name;
                if ("PRODUCTION_WIP_ACCUMULATION".equals(eventType)) {
                        name = debit ? "WIP" : "Raw Material Inventory";
                } else {
                        name = debit ? "Finished Goods Inventory" : "WIP";
                }
                return chartOfAccountRepository.findByCompanyIdAndAccountNameIgnoreCaseAndIsDeletedFalse(companyId, name)
                                .orElseThrow(() -> new BadRequestException(
                                                "Manufacturing account mapping is missing: " + name, "MANUFACTURING_ACCOUNT_MAPPING_MISSING"));
        }

    private void validateContract(ManufacturingJournalRequest request) {
        if (request.getSourceModule() != SourceModule.MANUFACTURING) {
            throw new BadRequestException("sourceModule must be MANUFACTURING", "INVALID_SOURCE_MODULE");
        }
        if (!"PRODUCTION_WIP_ACCUMULATION".equals(request.getEventType())
                && !"PRODUCTION_COMPLETION".equals(request.getEventType())) {
            throw new BadRequestException("Unsupported manufacturing accounting event", "INVALID_EVENT_TYPE");
        }
    }

    private boolean contains(LocalDate start, LocalDate end, LocalDate value) {
        return start != null && end != null && !value.isBefore(start) && !value.isAfter(end);
    }

    private ManufacturingJournalResponse toResponse(GlJournalEntry entry) {
        return ManufacturingJournalResponse.builder()
                .journalEntryId(entry.getId())
                .status("SUCCESS")
                .postingStatus(entry.getStatus())
                .sourceModule(entry.getSourceModule() == null ? null : entry.getSourceModule().name())
                .sourceId(entry.getSourceId())
                .eventType(entry.getEventType())
                .idempotencyKey(entry.getIdempotencyKey())
                .voucherNumber(entry.getVoucherNo())
                .totalDebit(entry.getTotalDebit())
                .totalCredit(entry.getTotalCredit())
                .createdAt(entry.getCreatedAt())
                .postedAt(entry.getPostedAt())
                .build();
    }
}
