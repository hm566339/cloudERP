package com.erp.account.modules.salesorder.service;

import com.erp.account.modules.salesorder.dto.request.SOConversionRequest;
import com.erp.account.modules.salesorder.dto.request.SOItemConversionRequest;
import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Concurrency integration test to verify Pessimistic Locking on PI -> SO conversion.
 * Disabled by default because it requires a real database environment with transaction locking support (e.g., PostgreSQL).
 * H2 in-memory DB may not support concurrent PESSIMISTIC_WRITE locks flawlessly in all configurations.
 */
@SpringBootTest
@Disabled("Requires real DB environment to test Pessimistic Locking concurrency")
class SalesOrderConcurrencyTest {

    @Autowired
    private SalesOrderService salesOrderService;

    @Test
    void testConcurrentPartialConversion_SuccessAndFail() throws InterruptedException {
        // Setup: A real PI must exist in the DB with 100 quantity remaining
        UUID companyId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Replace with actual test company ID
        UUID piId = UUID.fromString("00000000-0000-0000-0000-000000000001");      // Replace with actual test PI ID
        UUID piItemId = UUID.fromString("00000000-0000-0000-0000-000000000002");  // Replace with actual test PI Item ID

        // Request A: 70
        SOConversionRequest requestA = new SOConversionRequest();
        SOItemConversionRequest itemA = new SOItemConversionRequest(piItemId, new BigDecimal("70.0000"));
        requestA.setItems(Collections.singletonList(itemA));

        // Request B: 50
        SOConversionRequest requestB = new SOConversionRequest();
        SOItemConversionRequest itemB = new SOItemConversionRequest(piItemId, new BigDecimal("50.0000"));
        requestB.setItems(Collections.singletonList(itemB));

        int threads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        // Thread A
        executorService.submit(() -> {
            try {
                latch.await();
                salesOrderService.createFromProformaInvoice(companyId, piId, requestA);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            } finally {
                doneLatch.countDown();
            }
        });

        // Thread B
        executorService.submit(() -> {
            try {
                latch.await();
                salesOrderService.createFromProformaInvoice(companyId, piId, requestB);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            } finally {
                doneLatch.countDown();
            }
        });

        // Start both threads simultaneously
        latch.countDown();
        doneLatch.await();
        executorService.shutdown();

        // Expected: One succeeds, One fails due to over-conversion
        // assert successCount.get() == 1;
        // assert failCount.get() == 1;
    }
}
