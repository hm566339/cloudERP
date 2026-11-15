package com.erp.crm.modules.outbox.service;

import com.erp.crm.modules.outbox.entity.CrmOutbox;
import com.erp.crm.modules.outbox.enums.OutboxStatus;
import com.erp.crm.modules.outbox.repository.CrmOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmOutboxServiceTest {

    @Mock
    private CrmOutboxRepository outboxRepository;

    @InjectMocks
    private CrmOutboxService outboxService;

    private UUID companyId;
    private UUID aggregateId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        aggregateId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Should publish outbox event with status PENDING and immediate nextAttemptAt")
    void testPublishEvent_Success() {
        when(outboxRepository.save(any(CrmOutbox.class))).thenAnswer(inv -> inv.getArgument(0));

        CrmOutbox event = outboxService.publishEvent(companyId, "QUOTATION", aggregateId, "QUOTATION_CREATED", "{}");

        assertNotNull(event);
        assertEquals(companyId, event.getCompanyId());
        assertEquals("QUOTATION", event.getAggregateType());
        assertEquals(aggregateId, event.getAggregateId());
        assertEquals("QUOTATION_CREATED", event.getEventType());
        assertEquals(OutboxStatus.PENDING, event.getStatus());
        assertEquals(0, event.getRetryCount());
        assertNotNull(event.getNextAttemptAt());
        verify(outboxRepository, times(1)).save(any(CrmOutbox.class));
    }

    @Test
    @DisplayName("Should process pending outbox events and mark them PROCESSED")
    void testProcessPendingOutboxEvents_Success() {
        CrmOutbox event = CrmOutbox.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .aggregateType("LEAD")
                .aggregateId(aggregateId)
                .eventType("LEAD_CONVERTED")
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .build();

        when(outboxRepository.findByStatusAndNextAttemptAtLessThanEqual(eq(OutboxStatus.PENDING), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(event));

        when(outboxRepository.save(any(CrmOutbox.class))).thenAnswer(inv -> inv.getArgument(0));

        outboxService.processPendingOutboxEvents();

        assertEquals(OutboxStatus.PROCESSED, event.getStatus());
        assertNotNull(event.getProcessedAt());
        assertNull(event.getLastError());
        verify(outboxRepository, times(1)).save(event);
    }

    @Test
    @DisplayName("Should mark outbox event as FAILED when max retries (5) are reached")
    void testProcessEvent_MaxRetriesReached_Failed() {
        CrmOutbox event = spy(CrmOutbox.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .aggregateType("QUOTATION")
                .aggregateId(aggregateId)
                .eventType("ORDER_SYNC")
                .status(OutboxStatus.PENDING)
                .retryCount(4) // currently at 4 retries, next failure hits 5
                .build());

        // Simulate failure by throwing in a spy or subclass
        doAnswer(inv -> { throw new RuntimeException("Simulated network timeout"); })
                .when(event).setProcessedAt(any());

        when(outboxRepository.save(any(CrmOutbox.class))).thenAnswer(inv -> inv.getArgument(0));

        outboxService.processSingleEvent(event);

        assertEquals(5, event.getRetryCount());
        assertEquals(OutboxStatus.FAILED, event.getStatus());
        assertTrue(event.getLastError().contains("Simulated network timeout"));
        verify(outboxRepository, times(1)).save(event);
    }
}
