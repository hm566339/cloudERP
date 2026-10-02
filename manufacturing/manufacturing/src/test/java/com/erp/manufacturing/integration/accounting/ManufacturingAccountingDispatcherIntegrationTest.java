package com.erp.manufacturing.integration.accounting;

import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.accounting.repository.ManufacturingAccountingEventRepository;
import com.erp.manufacturing.accounting.util.AccountingEventIdentity;
import com.erp.manufacturing.common.enums.OutboxEventType;
import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.integration.accounting.client.AccountingFeignClient;
import com.erp.manufacturing.integration.accounting.dto.AccountingJournalResponse;
import com.erp.manufacturing.integration.accounting.service.ManufacturingAccountingDispatcher;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class ManufacturingAccountingDispatcherIntegrationTest {
    @Autowired private ManufacturingAccountingDispatcher dispatcher;
    @Autowired private ManufacturingAccountingEventRepository accountingEventRepository;
    @Autowired private ManufacturingOutboxRepository outboxRepository;
    @Autowired private ObjectMapper objectMapper;
        @Autowired private JdbcTemplate jdbcTemplate;
    @MockitoBean private AccountingFeignClient accountingFeignClient;

    private UUID companyId;
    private UUID productionOrderId;
    private UUID sourceId;
    private String idempotencyKey;
    private UUID outboxId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        productionOrderId = UUID.randomUUID();
        idempotencyKey = AccountingEventIdentity.idempotencyKey(companyId, productionOrderId,
                OutboxEventType.PRODUCTION_WIP_ACCUMULATION, "WIP-V1");
        sourceId = AccountingEventIdentity.sourceId(idempotencyKey);
        LocalDateTime now = LocalDateTime.now();
        accountingEventRepository.save(ManufacturingAccountingEvent.builder()
                .companyId(companyId).productionOrderId(productionOrderId)
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION)
                .sourceModule(AccountingEventIdentity.SOURCE_MODULE).sourceId(sourceId)
                .referenceNo("MC-TEST").amount(new BigDecimal("25.00")).currencyCode("USD")
                .idempotencyKey(idempotencyKey).status(AccountingEventStatus.PENDING)
                .createdAt(now).updatedAt(now).build());
        var payload = objectMapper.createObjectNode();
        payload.put("sourceId", sourceId.toString());
        payload.put("accountingEligible", true);
        ManufacturingOutbox outbox = outboxRepository.save(ManufacturingOutbox.builder()
                .companyId(companyId).aggregateType("MATERIAL_CONSUMPTION").aggregateId(UUID.randomUUID())
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION).idempotencyKey(idempotencyKey)
                .payload(payload).status(OutboxStatus.PENDING).retryCount(0)
                .createdAt(now).updatedAt(now).build());
        outboxId = outbox.getId();
    }

    @Test
    void successfulAccountResponsePersistsJournalIdAndSuccess() {
        UUID journalId = UUID.randomUUID();
        AccountingJournalResponse response = new AccountingJournalResponse();
        response.setJournalEntryId(journalId);
        when(accountingFeignClient.postManufacturingJournal(any())).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(response)));

        dispatcher.dispatch(outboxId);

        ManufacturingAccountingEvent event = accountingEventRepository
                .findByCompanyIdAndSourceModuleAndSourceId(companyId, AccountingEventIdentity.SOURCE_MODULE, sourceId)
                .orElseThrow();
        ManufacturingOutbox outbox = outboxRepository.findById(outboxId).orElseThrow();
        assertEquals(AccountingEventStatus.SUCCESS, event.getStatus());
        assertEquals(journalId, event.getJournalEntryId());
        assertEquals(OutboxStatus.SUCCESS, outbox.getStatus());
    }

    @Test
    void accountFailureRemainsRetryableAndLostResponseRetryReconciles() {
        UUID journalId = UUID.randomUUID();
        AccountingJournalResponse response = new AccountingJournalResponse();
        response.setJournalEntryId(journalId);
        when(accountingFeignClient.postManufacturingJournal(any()))
                .thenThrow(new RuntimeException("response lost"))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(response)));

        dispatcher.dispatch(outboxId);
        ManufacturingAccountingEvent failed = accountingEventRepository.findById(
                accountingEventRepository.findAll().stream().filter(event -> event.getSourceId().equals(sourceId))
                        .findFirst().orElseThrow().getId()).orElseThrow();
        assertEquals(AccountingEventStatus.FAILED, failed.getStatus());
        assertEquals(OutboxStatus.FAILED, outboxRepository.findById(outboxId).orElseThrow().getStatus());

        dispatcher.dispatch(outboxId);
        ManufacturingAccountingEvent recovered = accountingEventRepository
                .findByCompanyIdAndSourceModuleAndSourceId(companyId, AccountingEventIdentity.SOURCE_MODULE, sourceId)
                .orElseThrow();
        assertEquals(AccountingEventStatus.SUCCESS, recovered.getStatus());
        assertEquals(journalId, recovered.getJournalEntryId());
        verify(accountingFeignClient, times(2)).postManufacturingJournal(any());
    }

        @Test
        void manufacturingAccountingUniqueConstraintsExistInTestDatabase() {
                assertEquals(1, constraintCount("UK_MFG_ACCT_SOURCE"));
                assertEquals(1, constraintCount("UK_MFG_ACCT_IDEMPOTENCY"));
        }

        private int constraintCount(String constraintName) {
                return jdbcTemplate.queryForObject(
                                "select count(*) from information_schema.table_constraints where upper(constraint_name) = ?",
                                Integer.class, constraintName);
        }
}
