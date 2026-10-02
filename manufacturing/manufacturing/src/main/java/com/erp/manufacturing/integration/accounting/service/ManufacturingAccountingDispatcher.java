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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ManufacturingAccountingDispatcher {
    private final ManufacturingOutboxRepository outboxRepository;
    private final ManufacturingAccountingEventRepository accountingEventRepository;
    private final AccountingFeignClient accountingFeignClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public void dispatch(UUID outboxId) {
        ManufacturingOutbox outbox = outboxRepository.findById(outboxId)
                .orElseThrow(() -> new IllegalArgumentException("Accounting outbox event not found"));
        if (!AccountingEventIdentity.isAccountingEvent(outbox.getEventType())
                || outbox.getStatus() == OutboxStatus.SUCCESS) {
            return;
        }
        JsonNode payload = outbox.getPayload();
        if (payload.has("accountingEligible") && !payload.get("accountingEligible").asBoolean()) {
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
            AccountingJournalRequest request = AccountingJournalRequest.builder()
                    .companyId(outbox.getCompanyId()).sourceModule(AccountingEventIdentity.SOURCE_MODULE)
                    .sourceId(sourceId).eventType(outbox.getEventType().name())
                    .referenceNo(event.getReferenceNo()).voucherDate(LocalDate.now())
                    .narration(outbox.getEventType().name()).currencyCode(event.getCurrencyCode())
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
            outbox.setStatus(OutboxStatus.FAILED);
            outbox.setLastError(exception.getMessage());
            outbox.setRetryCount(outbox.getRetryCount() == null ? 1 : outbox.getRetryCount() + 1);
            outbox.setNextAttemptAt(LocalDateTime.now().plusMinutes(1));
        }
        event.setUpdatedAt(LocalDateTime.now());
        outbox.setUpdatedAt(LocalDateTime.now());
        accountingEventRepository.save(event);
        outboxRepository.save(outbox);
    }

}
