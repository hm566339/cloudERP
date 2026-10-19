package com.erp.manufacturing.integration.accounting.service;

import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.accounting.repository.ManufacturingAccountingEventRepository;
import com.erp.manufacturing.accounting.util.AccountingEventIdentity;
import com.erp.manufacturing.common.enums.OutboxEventType;
import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.integration.accounting.client.AccountingFeignClient;
import com.erp.manufacturing.integration.accounting.dto.AccountingJournalRequest;
import com.erp.manufacturing.integration.accounting.dto.AccountingJournalResponse;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.security.sso.CompanyCurrencyService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ManufacturingAccountingDispatcher {
    private final ManufacturingOutboxRepository outboxRepository;
    private final ManufacturingAccountingEventRepository accountingEventRepository;
    private final AccountingFeignClient accountingFeignClient;
    private final ObjectMapper objectMapper;
    private final CompanyCurrencyService companyCurrencyService;

    @Autowired
    public ManufacturingAccountingDispatcher(ManufacturingOutboxRepository outboxRepository,
                                           ManufacturingAccountingEventRepository accountingEventRepository,
                                           AccountingFeignClient accountingFeignClient,
                                           ObjectMapper objectMapper,
                                           @Autowired(required = false) CompanyCurrencyService companyCurrencyService) {
        this.outboxRepository = outboxRepository;
        this.accountingEventRepository = accountingEventRepository;
        this.accountingFeignClient = accountingFeignClient;
        this.objectMapper = objectMapper;
        this.companyCurrencyService = companyCurrencyService;
    }

    public ManufacturingAccountingDispatcher(ManufacturingOutboxRepository outboxRepository,
                                           ManufacturingAccountingEventRepository accountingEventRepository,
                                           AccountingFeignClient accountingFeignClient,
                                           ObjectMapper objectMapper) {
        this(outboxRepository, accountingEventRepository, accountingFeignClient, objectMapper, null);
    }

    @Transactional
    public void dispatch(UUID outboxId) {
        ManufacturingOutbox outbox = outboxRepository.findById(outboxId)
                .orElseThrow(() -> new IllegalArgumentException("Accounting outbox event not found"));
        if (outbox.getStatus() == OutboxStatus.SUCCESS) {
            return;
        }
        if (!AccountingEventIdentity.isAccountingEvent(outbox.getEventType())) {
            outbox.setStatus(OutboxStatus.SUCCESS);
            outbox.setProcessedAt(LocalDateTime.now());
            outbox.setUpdatedAt(LocalDateTime.now());
            outboxRepository.save(outbox);
            return;
        }
        JsonNode payload = outbox.getPayload();
        if (payload != null && payload.has("accountingEligible") && !payload.get("accountingEligible").asBoolean()) {
            outbox.setStatus(OutboxStatus.SUCCESS);
            outbox.setProcessedAt(LocalDateTime.now());
            outbox.setUpdatedAt(LocalDateTime.now());
            outboxRepository.save(outbox);
            return;
        }
        UUID sourceId = UUID.fromString(payload.get("sourceId").asText());
        ManufacturingAccountingEvent event = accountingEventRepository
                .findByCompanyIdAndSourceModuleAndSourceId(outbox.getCompanyId(),
                        AccountingEventIdentity.SOURCE_MODULE, sourceId)
                .orElseThrow(() -> new IllegalStateException("Accounting event identity not found"));
        outbox.setStatus(OutboxStatus.PROCESSING);
        outbox.setUpdatedAt(LocalDateTime.now());
        outboxRepository.save(outbox);
        event.setStatus(AccountingEventStatus.PROCESSING);
        event.setUpdatedAt(LocalDateTime.now());
        accountingEventRepository.save(event);
        try {
            String currencyCode = event.getCurrencyCode();
            if ((currencyCode == null || currencyCode.isBlank()) && payload.has("currencyCode") && !payload.get("currencyCode").isNull()) {
                currencyCode = payload.get("currencyCode").asText();
            }
            if ((currencyCode == null || currencyCode.isBlank()) && companyCurrencyService != null) {
                currencyCode = companyCurrencyService.getCompanyCurrency(outbox.getCompanyId());
            }
            if (currencyCode == null || currencyCode.isBlank()) {
                throw new IllegalStateException("Currency code could not be resolved for accounting journal dispatch");
            }
            if (event.getCurrencyCode() == null || event.getCurrencyCode().isBlank()) {
                event.setCurrencyCode(currencyCode);
            }

            AccountingJournalRequest request = AccountingJournalRequest.builder()
                    .companyId(outbox.getCompanyId()).sourceModule(AccountingEventIdentity.SOURCE_MODULE)
                    .sourceId(sourceId).eventType(outbox.getEventType().name())
                    .referenceNo(event.getReferenceNo()).voucherDate(LocalDate.now())
                    .narration(outbox.getEventType().name()).currencyCode(currencyCode)
                    .idempotencyKey(event.getIdempotencyKey()).amount(event.getAmount()).build();
            ResponseEntity<InventoryApiResponse<AccountingJournalResponse>> response =
                    accountingFeignClient.postManufacturingJournal(request);
            InventoryApiResponse<AccountingJournalResponse> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null
                    || body.getData().getJournalEntryId() == null) {
                throw new IllegalStateException("Account did not return a journal entry");
            }
            event.setJournalEntryId(body.getData().getJournalEntryId());
            event.setStatus(AccountingEventStatus.SUCCESS);
            event.setLastError(null);
            outbox.setStatus(OutboxStatus.SUCCESS);
            outbox.setProcessedAt(LocalDateTime.now());
        } catch (Exception exception) {
            event.setStatus(AccountingEventStatus.FAILED);
            event.setLastError(exception.getMessage());
            int currentRetries = outbox.getRetryCount() == null ? 0 : outbox.getRetryCount();
            int nextRetries = currentRetries + 1;
            outbox.setRetryCount(nextRetries);
            outbox.setLastError(exception.getMessage());
            if (nextRetries >= 5) {
                outbox.setStatus(OutboxStatus.DEAD_LETTER);
                outbox.setNextAttemptAt(null);
            } else {
                outbox.setStatus(OutboxStatus.FAILED);
                long backoffSeconds = (long) Math.pow(2, nextRetries - 1) * 5L;
                outbox.setNextAttemptAt(LocalDateTime.now().plusSeconds(backoffSeconds));
            }
        }
        event.setUpdatedAt(LocalDateTime.now());
        outbox.setUpdatedAt(LocalDateTime.now());
        accountingEventRepository.save(event);
        outboxRepository.save(outbox);
    }

}
