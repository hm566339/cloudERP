package com.erp.account.modules.integration.inventory.service;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInRequest;
import com.erp.account.common.dto.inventory.response.PurchaseInvoiceStockInResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.InventoryStockOutException;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.integration.inventory.repository.InventorySyncTaskRepository;
import com.erp.account.enums.ItemType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryIntegrationServiceUomTest {

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private InventorySyncTaskRepository inventorySyncTaskRepository;

    @InjectMocks
    private InventoryIntegrationService service;

    @Test
    void forwardsTransactionUomAndQuantityWithoutConversion() {
        ApInvoice invoice = invoice(ItemType.PRODUCT, "KG", new BigDecimal("100"), new BigDecimal("80"));
        mockSuccessfulInventoryResponse();

        service.processStockIn(task(invoice), invoice);

        PurchaseInvoiceStockInRequest request = capturedRequest();
        assertEquals(new BigDecimal("100"), request.getItems().get(0).getQuantity());
        assertEquals("KG", request.getItems().get(0).getUnit());
        assertEquals(new BigDecimal("80"), request.getItems().get(0).getUnitPrice());
    }

    @Test
    void forwardsTonWithoutConvertingInAccount() {
        ApInvoice invoice = invoice(ItemType.PRODUCT, "TON", new BigDecimal("2"), new BigDecimal("50000"));
        mockSuccessfulInventoryResponse();

        service.processStockIn(task(invoice), invoice);

        PurchaseInvoiceStockInRequest request = capturedRequest();
        assertEquals(new BigDecimal("2"), request.getItems().get(0).getQuantity());
        assertEquals("TON", request.getItems().get(0).getUnit());
        assertEquals(new BigDecimal("50000"), request.getItems().get(0).getUnitPrice());
    }

    @Test
    void forwardsPcsAndDecimalQuantities() {
        ApInvoice invoice = invoice(ItemType.PRODUCT, "PCS", new BigDecimal("10"), new BigDecimal("25"));
        mockSuccessfulInventoryResponse();
        service.processStockIn(task(invoice), invoice);
        assertEquals("PCS", capturedRequest().getItems().get(0).getUnit());

        ApInvoice decimalInvoice = invoice(ItemType.PRODUCT, "KG", new BigDecimal("2.75"), new BigDecimal("80"));
        mockSuccessfulInventoryResponse();
        service.processStockIn(task(decimalInvoice), decimalInvoice);
        assertEquals(new BigDecimal("2.75"), capturedRequest().getItems().get(0).getQuantity());
        assertEquals("KG", capturedRequest().getItems().get(0).getUnit());
    }

    @Test
    void rejectsMissingUomBeforeCallingInventory() {
        ApInvoice invoice = invoice(ItemType.PRODUCT, null, new BigDecimal("100"), new BigDecimal("80"));

        assertThrows(InventoryStockOutException.class, () -> service.processStockIn(task(invoice), invoice));
        verify(inventoryClient, never()).createStockIn(any());
    }

    @Test
    void rejectsMissingUomBeforeCreatingTask() {
        ApInvoice invoice = invoice(ItemType.PRODUCT, " ", new BigDecimal("100"), new BigDecimal("80"));

        assertThrows(InventoryStockOutException.class, () -> service.scheduleStockIn(invoice));
        verify(inventorySyncTaskRepository, never()).save(any());
    }

    @Test
    void expenseDoesNotCreateInventoryTask() {
        ApInvoice invoice = invoice(ItemType.EXPENSE, null, new BigDecimal("1"), new BigDecimal("100"));

        service.scheduleStockIn(invoice);

        verify(inventorySyncTaskRepository, never()).save(any());
    }

    private void mockSuccessfulInventoryResponse() {
        PurchaseInvoiceStockInResponse response = new PurchaseInvoiceStockInResponse();
        response.setStatus("SUCCESS");
        when(inventoryClient.createStockIn(any()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(response, "ok")));
    }

    private PurchaseInvoiceStockInRequest capturedRequest() {
        ArgumentCaptor<PurchaseInvoiceStockInRequest> captor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient, org.mockito.Mockito.atLeastOnce()).createStockIn(captor.capture());
        return captor.getAllValues().get(captor.getAllValues().size() - 1);
    }

    private InventorySyncTask task(ApInvoice invoice) {
        InventorySyncTask task = new InventorySyncTask();
        task.setId(UUID.randomUUID());
        task.setInvoiceId(invoice.getId());
        return task;
    }

    private ApInvoice invoice(ItemType itemType, String unit, BigDecimal quantity, BigDecimal unitPrice) {
        UUID companyId = UUID.randomUUID();
        Company company = new Company();
        company.setId(companyId);

        ApInvoice invoice = new ApInvoice();
        invoice.setId(UUID.randomUUID());
        invoice.setCompany(company);
        invoice.setInvoiceNo("AP-001");
        invoice.setInvoiceDate(LocalDate.of(2026, 9, 8));

        ApInvoiceItem item = new ApInvoiceItem();
        item.setItemId(UUID.randomUUID());
        item.setItemType(itemType);
        item.setUnit(unit);
        item.setQuantity(quantity);
        item.setUnitPrice(unitPrice);
        item.setWarehouseId(UUID.randomUUID());
        item.setLocationId(UUID.randomUUID());
        item.setIsDeleted(false);
        invoice.setItems(List.of(item));
        return invoice;
    }
}
