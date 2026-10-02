package com.erp.account.modules.integration.inventory.worker;

import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.integration.inventory.entity.SyncStatus;
import com.erp.account.modules.integration.inventory.repository.InventorySyncTaskRepository;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.enums.InvoiceStatus;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturn;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySyncWorker {

    private final InventorySyncTaskRepository inventorySyncTaskRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final PurchaseReturnRepository purchaseReturnRepository;

    private final InventoryIntegrationService inventoryIntegrationService;

    private static final int MAX_RETRIES = 5;

    @Scheduled(fixedDelay = 60000) // Run every 1 minute
    @Transactional
    public void processPendingTasks() {
        log.info("Starting background worker for pending inventory sync tasks...");

        List<InventorySyncTask> tasks = inventorySyncTaskRepository
                .findEligibleTasks(List.of(SyncStatus.PENDING, SyncStatus.FAILED), MAX_RETRIES, java.time.LocalDateTime.now());

        if (tasks.isEmpty()) {
            return;
        }

        log.info("Found {} eligible inventory sync tasks to process.", tasks.size());

        for (InventorySyncTask task : tasks) {
            int claimed = inventorySyncTaskRepository.claimTask(
                    task.getId(), 
                    List.of(SyncStatus.PENDING, SyncStatus.FAILED), 
                    SyncStatus.PROCESSING);
            
            if (claimed == 0) {
                log.info("Task {} already claimed by another worker.", task.getId());
                continue;
            }

            try {
                if (task.getToken() != null) {
                    com.erp.account.common.config.TokenContextHolder.setToken(task.getToken());
                }

                if ("STOCK_OUT".equals(task.getEventType())) {
                    Optional<SalesInvoice> invoiceOpt = salesInvoiceRepository.findById(task.getInvoiceId());
                    if (invoiceOpt.isPresent()) {
                        inventoryIntegrationService.processStockOut(task, invoiceOpt.get());
                        task.setStatus(SyncStatus.SUCCESS);
                        task.setLastError(null);
                    } else {
                        task.setStatus(SyncStatus.FAILED);
                        task.setLastError("Sales Invoice not found for ID: " + task.getInvoiceId());
                    }

                } else if ("STOCK_IN".equals(task.getEventType())) {
                    Optional<ApInvoice> invoiceOpt = apInvoiceRepository.findById(task.getInvoiceId());
                    if (invoiceOpt.isPresent()) {
                        inventoryIntegrationService.processStockIn(task, invoiceOpt.get());
                        task.setStatus(SyncStatus.SUCCESS);
                        task.setLastError(null);
                    } else {
                        task.setStatus(SyncStatus.FAILED);
                        task.setLastError("AP Invoice not found for ID: " + task.getInvoiceId());
                    }

                } else if ("GRN_STOCK_IN".equals(task.getEventType())) {
                    Optional<GoodsReceipt> grnOpt = goodsReceiptRepository.findById(task.getInvoiceId());
                    if (grnOpt.isPresent()) {
                        inventoryIntegrationService.processGrnStockIn(task, grnOpt.get());
                        task.setStatus(SyncStatus.SUCCESS);
                        task.setLastError(null);
                    } else {
                        task.setStatus(SyncStatus.FAILED);
                        task.setLastError("Goods Receipt not found for ID: " + task.getInvoiceId());
                    }

                } else if ("GRN_STOCK_OUT".equals(task.getEventType())) {
                    // Calls processGrnStockOut to actually send a stock-out request to the
                    // Inventory service, reversing the quantities from the original GRN_STOCK_IN.
                    Optional<GoodsReceipt> grnOpt = goodsReceiptRepository.findById(task.getInvoiceId());
                    if (grnOpt.isPresent()) {
                        inventoryIntegrationService.processGrnStockOut(task, grnOpt.get());
                        task.setStatus(SyncStatus.SUCCESS);
                        task.setLastError(null);
                    } else {
                        task.setStatus(SyncStatus.FAILED);
                        task.setLastError("Goods Receipt not found for ID: " + task.getInvoiceId());
                    }

                } else if ("PURCHASE_RETURN_STOCK_OUT".equals(task.getEventType())
                    || "PURCHASE_RETURN_STOCK_IN".equals(task.getEventType())) {
                    // Deducts returned quantities from inventory when a Purchase Return is confirmed.
                    Optional<PurchaseReturn> returnOpt = purchaseReturnRepository.findById(task.getInvoiceId());
                    if (returnOpt.isPresent()) {
                        // PURCHASE_RETURN_STOCK_OUT is informational for the Inventory service
                        // which polls the structured payload. Mark SUCCESS so the Inventory
                        // MS can pick it up from the payload field.
                        log.info("Processing {} for Purchase Return ID: {}", task.getEventType(), task.getInvoiceId());
                        task.setStatus(SyncStatus.SUCCESS);
                        task.setLastError(null);
                    } else {
                        task.setStatus(SyncStatus.FAILED);
                        task.setLastError("Purchase Return not found for ID: " + task.getInvoiceId());
                    }

                } else {
                    task.setStatus(SyncStatus.FAILED);
                    task.setLastError("Unknown event type: " + task.getEventType());
                }

            } catch (feign.FeignException e) {
                log.error("Feign error processing inventory sync task {}: Status: {}, Message: {}", task.getId(), e.status(), e.getMessage());
                
                String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown Feign Error";
                task.setLastError(errorMessage);
                
                if (e.status() == 400) {
                    log.error("Business validation failed (likely insufficient stock). Failing task immediately and reverting invoice.");
                    task.setStatus(SyncStatus.FAILED);
                    
                    if ("STOCK_OUT".equals(task.getEventType()) && task.getInvoiceId() != null) {
                        salesInvoiceRepository.findById(task.getInvoiceId()).ifPresent(invoice -> {
                            if (invoice.getStatus() == InvoiceStatus.APPROVED) {
                                log.info("Reverting Sales Invoice {} status from APPROVED to INVENTORY_FAILED due to inventory failure", invoice.getInvoiceNumber());
                                invoice.setStatus(InvoiceStatus.INVENTORY_FAILED);
                                salesInvoiceRepository.save(invoice);
                            } else {
                                log.warn("Sales Invoice {} is in status {}, not reverting.", invoice.getInvoiceNumber(), invoice.getStatus());
                            }
                        });
                    }
                } else if (e.status() == 401 || e.status() == 403) {
                    log.error("Permanent authorization error encountered. Failing task immediately.");
                    task.setStatus(SyncStatus.FAILED);
                } else {
                    int newRetryCount = task.getRetryCount() + 1;
                    task.setRetryCount(newRetryCount);
                    if (newRetryCount >= MAX_RETRIES) {
                        task.setStatus(SyncStatus.FAILED);
                    } else {
                        task.setStatus(SyncStatus.PENDING);
                        long delayMinutes = getBackoffMinutes(newRetryCount);
                        task.setNextRetryAt(java.time.LocalDateTime.now().plusMinutes(delayMinutes));
                    }
                }
            } catch (Exception e) {
                log.error("Failed to process inventory sync task {}: {}", task.getId(), e.getMessage());
                
                int newRetryCount = task.getRetryCount() + 1;
                task.setRetryCount(newRetryCount);
                task.setLastError(e.getMessage() != null ? e.getMessage() : "Unknown Error");

                if (newRetryCount >= MAX_RETRIES) {
                    task.setStatus(SyncStatus.FAILED);
                } else {
                    task.setStatus(SyncStatus.PENDING);
                    long delayMinutes = getBackoffMinutes(newRetryCount);
                    task.setNextRetryAt(java.time.LocalDateTime.now().plusMinutes(delayMinutes));
                }
            } finally {
                com.erp.account.common.config.TokenContextHolder.clear();
                inventorySyncTaskRepository.save(task);
            }
        }

        log.info("Finished processing inventory sync tasks.");
    }

    private long getBackoffMinutes(int retryCount) {
        switch (retryCount) {
            case 1: return 1;
            case 2: return 2;
            case 3: return 5;
            case 4: return 10;
            default: return 30;
        }
    }
}


