package com.erp.account.modules.companyinitialization.service.impl;

import com.erp.account.enums.AccountCategoryType;
import com.erp.account.enums.AccountNature;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import com.erp.account.modules.accountcategory.repository.AccountCategoryRepository;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.accountgroup.repository.AccountGroupRepository;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.enums.PeriodType;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.companyinitialization.dto.CompanyInitializationResult;
import com.erp.account.modules.companyinitialization.dto.InitializationStepResult;
import com.erp.account.modules.companyinitialization.exception.CompanyInitializationException;
import com.erp.account.modules.companyinitialization.service.CompanyInitializationService;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;

import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.vouchersequence.entity.VoucherSequence;
import com.erp.account.modules.vouchersequence.repository.VoucherSequenceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyInitializationServiceImpl implements CompanyInitializationService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);

    private final AccountCategoryRepository accountCategoryRepository;
    private final AccountGroupRepository accountGroupRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final FiscalYearRepository fiscalYearRepository;
    private final AccountingPeriodRepository accountingPeriodRepository;

    private final VoucherSequenceRepository voucherSequenceRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public CompanyInitializationResult initializeCompany(Company company) {
        validateCompany(company);
        log.info("Starting company initialization for companyId: {}", company.getId());

        Company managedCompany = companyRepository.findByIdForUpdate(company.getId())
                .orElseThrow(() -> new IllegalArgumentException("Company must be persisted before initialization"));

        if (Boolean.TRUE.equals(managedCompany.getInitializationCompleted())) {
            log.info("Company initialization already completed for companyId: {}", managedCompany.getId());
            return CompanyInitializationResult.builder()
                    .companyId(managedCompany.getId())
                    .companyCode(managedCompany.getCompanyCode())
                    .build();
        }

        try {
            managedCompany.setInitializationInProgress(true);
            managedCompany.setInitializationCompleted(false);

            SeedResult<AccountCategoryType, AccountCategory> categoryResult = initializeAccountCategories(
                    managedCompany);
            SeedResult<String, AccountGroup> groupResult = initializeAccountGroups(managedCompany,
                    categoryResult.records());
            InitializationStepResult accounts = initializeChartOfAccounts(managedCompany, groupResult.records());
            FiscalYear fiscalYear = initializeFiscalYear(managedCompany);

            CompanyInitializationResult result = CompanyInitializationResult.builder()
                    .companyId(managedCompany.getId())
                    .companyCode(managedCompany.getCompanyCode())
                    .step(categoryResult.stepResult())
                    .step(groupResult.stepResult())
                    .step(accounts)
                    .step(initializeAccountingPeriods(managedCompany, fiscalYear))

                    .step(initializeVoucherSequences(managedCompany))
                    .build();

            managedCompany.setInitializationCompleted(true);
            managedCompany.setInitializationInProgress(false);

            log.info("Completed company initialization for companyId: {}", managedCompany.getId());
            return result;
        } catch (RuntimeException ex) {
            managedCompany.setInitializationInProgress(false);
            managedCompany.setInitializationCompleted(false);
            log.error("Company initialization failed for companyId: {}", managedCompany.getId(), ex);
            throw new CompanyInitializationException("Failed to initialize company accounting master data", ex);
        }
    }

    private SeedResult<AccountCategoryType, AccountCategory> initializeAccountCategories(Company company) {
        log.info("Initializing account categories for companyId: {}", company.getId());
        Map<AccountCategoryType, AccountNature> defaults = Map.of(
                AccountCategoryType.AST, AccountNature.DEBIT,
                AccountCategoryType.EXP, AccountNature.DEBIT,
                AccountCategoryType.LIA, AccountNature.CREDIT,
                AccountCategoryType.INC, AccountNature.CREDIT,
                AccountCategoryType.EQT, AccountNature.CREDIT);
        Map<AccountCategoryType, AccountCategory> result = new LinkedHashMap<>();
        AtomicInteger created = new AtomicInteger();
        AtomicInteger existing = new AtomicInteger();
        List<AccountCategory> toCreate = new ArrayList<>();
        defaults.forEach((type, nature) -> {
            AccountCategory category = accountCategoryRepository.findByCodeAndCompanyId(type.name(), company.getId())
                    .map(found -> {
                        existing.incrementAndGet();
                        return found;
                    })
                    .orElseGet(() -> {
                        created.incrementAndGet();
                        AccountCategory accountCategory = AccountCategory.builder()
                                .company(company)
                                .code(type.name())
                                .name(type.getDisplayName())
                                .nature(nature)
                                .build();
                        toCreate.add(accountCategory);
                        return accountCategory;
                    });
            result.put(type, category);
        });
        if (!toCreate.isEmpty()) {
            accountCategoryRepository.saveAll(toCreate);
        }
        return new SeedResult<>(result, step("Account Categories", created.get(), existing.get()));
    }

    private SeedResult<String, AccountGroup> initializeAccountGroups(Company company,
            Map<AccountCategoryType, AccountCategory> categories) {
        log.info("Initializing account groups for companyId: {}", company.getId());
        Map<String, AccountGroup> result = new LinkedHashMap<>();
        AtomicInteger created = new AtomicInteger();
        AtomicInteger existing = new AtomicInteger();
        groupDefaults().forEach((code, spec) -> {
            AccountGroup group = accountGroupRepository.findByCodeAndCompanyId(code, company.getId())
                    .orElseGet(() -> {
                        created.incrementAndGet();
                        AccountGroup ag = AccountGroup.builder()
                                .company(company)
                                .category(categories.get(spec.categoryType()))
                                .code(code)
                                .name(spec.name())
                                .build();
                        return accountGroupRepository.save(ag);
                    });
            result.put(code, group);
        });
        return new SeedResult<>(result, step("Account Groups", created.get(), existing.get()));
    }

    private InitializationStepResult initializeChartOfAccounts(Company company, Map<String, AccountGroup> groups) {
        log.info("Initializing chart of accounts for companyId: {}", company.getId());
        int created = 0;
        int existing = 0;
        List<ChartOfAccount> toCreate = new ArrayList<>();
        for (AccountSpec spec : accountDefaults()) {
            if (chartOfAccountRepository
                    .findByCompanyIdAndAccountNameIgnoreCaseAndIsDeletedFalse(company.getId(), spec.name())
                    .isPresent()) {
                existing++;
                continue;
            }
            AccountGroup group = groups.get(spec.groupName());

            if (group == null) {
                log.error("Failed to create account '{}'. Group Code '{}' not found in initialization map.",
                        spec.name(), spec.groupName());
                throw new IllegalStateException("Account Group not found for group code: " + spec.groupName());
            }

            if (group.getCategory() == null) {
                log.error("Failed to create account '{}'. Category is null for group '{}'.", spec.name(),
                        group.getCode());
                throw new IllegalStateException("Account Category is null for group code: " + spec.groupName());
            }

            AccountCategoryType catType = AccountCategoryType.AST;
            if (group.getCategory().getCode() != null) {
                try {
                    catType = AccountCategoryType.valueOf(group.getCategory().getCode());
                } catch (Exception e) {
                    if (group.getCategory().getNature() == AccountNature.CREDIT) {
                        catType = AccountCategoryType.LIA;
                    }
                }
            }
            String accountCode = generateAccountCode(company.getId(), catType, spec.sequence());
            toCreate.add(ChartOfAccount.builder()
                    .company(company)
                    .group(group)
                    .accountCode(accountCode)
                    .accountName(spec.name())
                    .accountType(group.getCategory().getNature())
                    .postingAllowed(true)
                    .isActive(true)
                    .openingBalance(BigDecimal.ZERO)
                    .isDeleted(false)
                    .build());
            created++;
        }
        if (!toCreate.isEmpty()) {
            chartOfAccountRepository.saveAll(toCreate);
        }
        return step("Chart Of Accounts", created, existing);
    }

    private FiscalYear initializeFiscalYear(Company company) {
        log.info("Initializing fiscal year for companyId: {}", company.getId());
        LocalDate today = LocalDate.now();
        int startYear = today.getMonthValue() >= Month.APRIL.getValue() ? today.getYear() : today.getYear() - 1;
        LocalDate start = LocalDate.of(startYear, Month.APRIL, 1);
        LocalDate end = LocalDate.of(startYear + 1, Month.MARCH, 31);
        String name = startYear + "-" + String.format("%02d", (startYear + 1) % 100);
        return fiscalYearRepository.findByCompanyIdAndFiscalYear(company.getId(), name)
                .orElseGet(() -> fiscalYearRepository.save(FiscalYear.builder()
                        .company(company)
                        .fiscalYear(name)
                        .startDate(start)
                        .endDate(end)
                        .status(FiscalYearStatus.OPEN)
                        .build()));
    }

    private InitializationStepResult initializeAccountingPeriods(Company company, FiscalYear fiscalYear) {
        log.info("Initializing accounting periods for companyId: {}", company.getId());
        int created = 0;
        int existing = 0;
        List<AccountingPeriod> toCreate = new ArrayList<>();
        LocalDate cursor = fiscalYear.getStartDate();
        for (int period = 1; period <= 12; period++) {
            if (accountingPeriodRepository.findByFiscalYearIdAndPeriodNumber(fiscalYear.getId(), period).isPresent()) {
                existing++;
            } else {
                YearMonth ym = YearMonth.from(cursor);
                toCreate.add(AccountingPeriod.builder()
                        .company(company)
                        .fiscalYear(fiscalYear)
                        .periodNumber(period)
                        .periodName(cursor.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                        .startDate(ym.atDay(1))
                        .endDate(ym.atEndOfMonth())
                        .periodType(PeriodType.MONTHLY)
                        .status(AccountingPeriodStatus.OPEN)
                        .build());
                created++;
            }
            cursor = cursor.plusMonths(1);
        }
        if (!toCreate.isEmpty()) {
            accountingPeriodRepository.saveAll(toCreate);
        }
        return step("Accounting Periods", created, existing);
    }

    private InitializationStepResult initializeVoucherSequences(Company company) {
        log.info("Initializing voucher sequences for companyId: {}", company.getId());
        int created = 0;
        int existing = 0;
        List<VoucherSequence> toCreate = new ArrayList<>();
        for (VoucherSpec spec : voucherDefaults()) {
            if (voucherSequenceRepository
                    .findByCompanyIdAndVoucherTypeIgnoreCaseAndIsDeletedFalse(company.getId(), spec.type())
                    .isPresent()) {
                existing++;
                continue;
            }
            toCreate.add(VoucherSequence.builder()
                    .company(company)
                    .voucherType(spec.type())
                    .prefix(spec.prefix())
                    .nextNumber(1L)
                    .paddingLength(6)
                    .isActive(true)
                    .build());
            created++;
        }
        if (!toCreate.isEmpty()) {
            voucherSequenceRepository.saveAll(toCreate);
        }
        return step("Voucher Sequences", created, existing);
    }


    private void validateCompany(Company company) {
        if (company == null || company.getId() == null) {
            throw new IllegalArgumentException("Company must be persisted before initialization");
        }
    }

    private InitializationStepResult step(String name, int total) {
        return step(name, total, 0);
    }

    private InitializationStepResult step(String name, int created, int existing) {
        return InitializationStepResult.builder().step(name).createdCount(created).existingCount(existing).build();
    }

    private BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private String generateAccountCode(UUID companyId, AccountCategoryType categoryType, int seedSequence) {
        int prefix = switch (categoryType) {
            case AST -> 1;
            case LIA -> 2;
            case EQT -> 3;
            case INC -> 4;
            case EXP -> 5;
        };
        int sequence = seedSequence;
        String code;
        do {
            code = String.format("%d%05d", prefix, sequence++);
        } while (chartOfAccountRepository.existsByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, code));
        return code;
    }

    private Map<String, GroupSpec> groupDefaults() {
        Map<String, GroupSpec> groups = new LinkedHashMap<>();
        groups.put("AST-CURRENT", new GroupSpec("Current Assets", AccountCategoryType.AST));
        groups.put("AST-FIXED", new GroupSpec("Fixed Assets", AccountCategoryType.AST));
        groups.put("AST-BANK", new GroupSpec("Bank Accounts", AccountCategoryType.AST));
        groups.put("AST-CASH", new GroupSpec("Cash & Cash Equivalent", AccountCategoryType.AST));
        groups.put("AST-AR", new GroupSpec("Accounts Receivable", AccountCategoryType.AST));
        groups.put("AST-GST-IN", new GroupSpec("GST Input", AccountCategoryType.AST));
        groups.put("LIA-CURRENT", new GroupSpec("Current Liabilities", AccountCategoryType.LIA));
        groups.put("LIA-AP", new GroupSpec("Accounts Payable", AccountCategoryType.LIA));
        groups.put("LIA-GST-OUT", new GroupSpec("GST Payable", AccountCategoryType.LIA));
        groups.put("LIA-TAX", new GroupSpec("Duties & Taxes", AccountCategoryType.LIA));
        groups.put("EQT-CAPITAL", new GroupSpec("Capital", AccountCategoryType.EQT));
        groups.put("EQT-RETAINED", new GroupSpec("Retained Earnings", AccountCategoryType.EQT));
        groups.put("INC-SALES", new GroupSpec("Sales", AccountCategoryType.INC));
        groups.put("INC-OTHER", new GroupSpec("Other Income", AccountCategoryType.INC));
        groups.put("EXP-PURCHASE", new GroupSpec("Purchase", AccountCategoryType.EXP));
        groups.put("EXP-DIRECT", new GroupSpec("Direct Expenses", AccountCategoryType.EXP));
        groups.put("EXP-INDIRECT", new GroupSpec("Indirect Expenses", AccountCategoryType.EXP));
        groups.put("EXP-EMPLOYEE", new GroupSpec("Employee Expenses", AccountCategoryType.EXP));
        groups.put("EXP-ADMIN", new GroupSpec("Administrative Expenses", AccountCategoryType.EXP));
        return groups;
    }

    private List<AccountSpec> accountDefaults() {
        return List.of(
                new AccountSpec("Cash In Hand", "AST-CASH", 1),
                new AccountSpec("Main Bank Account", "AST-BANK", 2),
                new AccountSpec("Accounts Receivable", "AST-AR", 3),
                new AccountSpec("Input CGST", "AST-GST-IN", 4),
                new AccountSpec("Input SGST", "AST-GST-IN", 5),
                new AccountSpec("Input IGST", "AST-GST-IN", 6),
                new AccountSpec("Input CESS", "AST-GST-IN", 7),
                new AccountSpec("Accounts Payable", "LIA-AP", 1),
                new AccountSpec("Output CGST", "LIA-GST-OUT", 2),
                new AccountSpec("Output SGST", "LIA-GST-OUT", 3),
                new AccountSpec("Output IGST", "LIA-GST-OUT", 4),
                new AccountSpec("Output CESS", "LIA-GST-OUT", 5),
                new AccountSpec("TDS Payable", "LIA-TAX", 6),
                new AccountSpec("Capital Account", "EQT-CAPITAL", 1),
                new AccountSpec("Opening Balance Equity", "EQT-RETAINED", 2),
                new AccountSpec("Sales Account", "INC-SALES", 1),
                new AccountSpec("Other Income", "INC-OTHER", 2),
                new AccountSpec("Purchase Account", "EXP-PURCHASE", 1),
                new AccountSpec("Purchase Return", "EXP-PURCHASE", 2),
                new AccountSpec("Salary Expense", "EXP-EMPLOYEE", 3),
                new AccountSpec("Rent Expense", "EXP-ADMIN", 4),
                new AccountSpec("Electricity Expense", "EXP-ADMIN", 5),
                new AccountSpec("Office Expense", "EXP-ADMIN", 6),
                new AccountSpec("Miscellaneous Expense", "EXP-INDIRECT", 7));
    }

    private List<VoucherSpec> voucherDefaults() {
        return List.of(
                new VoucherSpec("Sales Invoice", "SI"),
                new VoucherSpec("Purchase Invoice", "PI"),
                new VoucherSpec("Journal Voucher", "JV"),
                new VoucherSpec("Payment Voucher", "PV"),
                new VoucherSpec("Receipt Voucher", "RV"),
                new VoucherSpec("Credit Note", "CN"),
                new VoucherSpec("Debit Note", "DN"));
    }

    private record GroupSpec(String name, AccountCategoryType categoryType) {
    }

    private record AccountSpec(String name, String groupName, int sequence) {
    }

    private record VoucherSpec(String type, String prefix) {
    }

    private record SeedResult<K, V>(Map<K, V> records, InitializationStepResult stepResult) {
    }
}
