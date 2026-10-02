package com.erp.account.modules.integration.manufacturing;

import com.erp.account.enums.AccountNature;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import com.erp.account.modules.accountcategory.repository.AccountCategoryRepository;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.accountgroup.repository.AccountGroupRepository;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.PeriodType;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class ManufacturingAccountingIntegrationJpaTest {
        @Autowired private com.erp.account.modules.integration.manufacturing.controller.ManufacturingAccountingIntegrationController controller;
        private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private AccountCategoryRepository categoryRepository;
    @Autowired private AccountGroupRepository groupRepository;
    @Autowired private ChartOfAccountRepository accountRepository;
    @Autowired private FiscalYearRepository fiscalYearRepository;
    @Autowired private AccountingPeriodRepository periodRepository;
    @Autowired private GlJournalEntryRepository journalRepository;
    @Autowired private GlJournalLineRepository lineRepository;
        @Autowired private JdbcTemplate jdbcTemplate;

    private Company company;
    private ChartOfAccount wip;
    private ChartOfAccount rawMaterial;
    private ChartOfAccount finishedGoods;
    private LocalDate postingDate;

    @BeforeEach
    void setUp() {
                mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        postingDate = LocalDate.of(2026, 6, 15);
        company = companyRepository.save(Company.builder().id(UUID.randomUUID())
                .companyCode("MFG-" + UUID.randomUUID().toString().substring(0, 8))
                .companyName("Manufacturing Test Company").baseCurrency("USD").active(true).build());
        AccountCategory category = categoryRepository.save(AccountCategory.builder()
                .company(company).code("ASSET-" + UUID.randomUUID()).name("Assets").nature(AccountNature.DEBIT).build());
        AccountGroup group = groupRepository.save(AccountGroup.builder().company(company).category(category)
                .code("INV-" + UUID.randomUUID()).name("Inventory").build());
        wip = saveAccount("WIP", group);
        rawMaterial = saveAccount("Raw Material Inventory", group);
        finishedGoods = saveAccount("Finished Goods Inventory", group);

        FiscalYear fiscalYear = fiscalYearRepository.save(FiscalYear.builder().company(company)
                .fiscalYear("2026-" + UUID.randomUUID()).startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31)).build());
        periodRepository.save(AccountingPeriod.builder().company(company).fiscalYear(fiscalYear)
                .periodNumber(1).periodName("June-2026-" + UUID.randomUUID())
                .startDate(LocalDate.of(2026, 1, 1)).endDate(LocalDate.of(2026, 12, 31))
                .periodType(PeriodType.CUSTOM).build());
    }

    @Test
    void wipIntentResolvesAccountsAndPosts() throws Exception {
        UUID sourceId = UUID.randomUUID();
        String key = "wip:" + UUID.randomUUID();
        JsonNode response = postIntent(sourceId, "PRODUCTION_WIP_ACCUMULATION", key, "125.50");
        UUID journalId = UUID.fromString(response.get("data").get("journalEntryId").asText());

        GlJournalEntry journal = journalRepository.findByIdWithLines(journalId).orElseThrow();
        assertEquals("POSTED", journal.getStatus().name());
        assertEquals(company.getId(), journal.getCompany().getId());
        assertEquals(SourceModule.MANUFACTURING, journal.getSourceModule());
        assertEquals(sourceId, journal.getSourceId());
        assertEquals("PRODUCTION_WIP_ACCUMULATION", journal.getEventType());
        assertEquals(key, journal.getIdempotencyKey());
        assertEquals(0, new BigDecimal("125.50").compareTo(journal.getTotalDebit()));
        assertEquals(2, journal.getJournalLines().size());
        assertTrue(journal.getJournalLines().stream().anyMatch(line -> line.getAccount().getId().equals(wip.getId())
                && new BigDecimal("125.50").compareTo(line.getDebitAmount()) == 0));
        assertTrue(journal.getJournalLines().stream().anyMatch(line -> line.getAccount().getId().equals(rawMaterial.getId())
                && new BigDecimal("125.50").compareTo(line.getCreditAmount()) == 0));
    }

    @Test
    void completionIntentResolvesFinishedGoodsAndWip() throws Exception {
        UUID sourceId = UUID.randomUUID();
        JsonNode response = postIntent(sourceId, "PRODUCTION_COMPLETION", "completion:" + UUID.randomUUID(), "80.00");
        UUID journalId = UUID.fromString(response.get("data").get("journalEntryId").asText());
        GlJournalEntry journal = journalRepository.findByIdWithLines(journalId).orElseThrow();
        assertEquals(1, journal.getJournalLines().stream().filter(line -> line.getAccount().getId().equals(finishedGoods.getId())
                && line.getDebitAmount().compareTo(new BigDecimal("80.00")) == 0).count());
        assertEquals(1, journal.getJournalLines().stream().filter(line -> line.getAccount().getId().equals(wip.getId())
                && line.getCreditAmount().compareTo(new BigDecimal("80.00")) == 0).count());
    }

    @Test
    void retryAndConcurrentDuplicateReturnOnePostedJournal() throws Exception {
        UUID sourceId = UUID.randomUUID();
        String key = "retry:" + UUID.randomUUID();
        String body = requestBody(sourceId, "PRODUCTION_WIP_ACCUMULATION", key, "42.00");
        int callers = 2;
        ExecutorService executor = Executors.newFixedThreadPool(callers);
        CountDownLatch start = new CountDownLatch(1);
        Future<JsonNode> first = executor.submit(() -> send(body, start));
        Future<JsonNode> second = executor.submit(() -> send(body, start));
        start.countDown();
        UUID firstId = UUID.fromString(first.get().get("data").get("journalEntryId").asText());
        UUID secondId = UUID.fromString(second.get().get("data").get("journalEntryId").asText());
        executor.shutdown();

        assertEquals(firstId, secondId);
        List<GlJournalEntry> entries = journalRepository.findBySourceModuleAndSourceId(SourceModule.MANUFACTURING, sourceId);
        assertEquals(1, entries.stream().filter(entry -> company.getId().equals(entry.getCompany().getId())).count());
        assertEquals(1, lineRepository.findAll().stream().filter(line -> line.getJournalEntry().getId().equals(firstId)).count() / 2);
        JsonNode retry = postIntent(sourceId, "PRODUCTION_WIP_ACCUMULATION", key, "42.00");
        assertEquals(firstId.toString(), retry.get("data").get("journalEntryId").asText());
    }

        @Test
        void sourceAndIdempotencyLookupsAreCompanyScoped() throws Exception {
                UUID sourceId = UUID.randomUUID();
                String key = "tenant:" + UUID.randomUUID();
                JsonNode response = postIntent(sourceId, "PRODUCTION_WIP_ACCUMULATION", key, "15.00");
                UUID journalId = UUID.fromString(response.get("data").get("journalEntryId").asText());
                UUID otherCompanyId = UUID.randomUUID();

                assertTrue(journalRepository.findFirstByCompanyIdAndSourceModuleAndSourceIdAndEventTypeAndIsDeletedFalse(
                                otherCompanyId, SourceModule.MANUFACTURING, sourceId, "PRODUCTION_WIP_ACCUMULATION").isEmpty());
                assertTrue(journalRepository.findFirstByCompanyIdAndSourceModuleAndIdempotencyKeyAndIsDeletedFalse(
                                otherCompanyId, SourceModule.MANUFACTURING, key).isEmpty());
                assertTrue(journalRepository.findById(journalId).isPresent());
        }

        @Test
        void accountIdentityUniqueIndexesExistInTestDatabase() {
                assertEquals(1, constraintCount("UK_GL_MANUFACTURING_SOURCE"));
                assertEquals(1, constraintCount("UK_GL_MANUFACTURING_IDEMPOTENCY"));
        }

        private int constraintCount(String constraintName) {
                return jdbcTemplate.queryForObject(
                                "select count(*) from information_schema.table_constraints where upper(constraint_name) = ?",
                                Integer.class, constraintName);
        }

    private JsonNode postIntent(UUID sourceId, String eventType, String key, String amount) throws Exception {
        return send(requestBody(sourceId, eventType, key, amount), new CountDownLatch(0));
    }

    private JsonNode send(String body, CountDownLatch start) throws Exception {
        start.await();
        String content = mockMvc.perform(post("/api/account/integration/manufacturing/journals")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(content);
    }

    private String requestBody(UUID sourceId, String eventType, String key, String amount) {
        return "{" +
                "\"companyId\":\"" + company.getId() + "\"," +
                "\"sourceModule\":\"MANUFACTURING\"," +
                "\"sourceId\":\"" + sourceId + "\"," +
                "\"eventType\":\"" + eventType + "\"," +
                "\"referenceNo\":\"MFG-TEST\"," +
                "\"voucherDate\":\"" + postingDate + "\"," +
                "\"narration\":\"Manufacturing test\"," +
                "\"currencyCode\":\"USD\"," +
                "\"idempotencyKey\":\"" + key + "\"," +
                "\"amount\":" + amount + "}";
    }

    private ChartOfAccount saveAccount(String name, AccountGroup group) {
        return accountRepository.save(ChartOfAccount.builder().company(company).group(group)
                .accountCode(name.replace(" ", "").toUpperCase() + UUID.randomUUID().toString().substring(0, 4))
                .accountName(name).accountType(AccountNature.DEBIT).postingAllowed(true).isActive(true).isDeleted(false).build());
    }
}
