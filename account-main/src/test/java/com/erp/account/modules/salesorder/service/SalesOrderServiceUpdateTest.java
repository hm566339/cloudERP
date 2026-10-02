package com.erp.account.modules.salesorder.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.salesorder.dto.request.SalesOrderItemUpdateRequest;
import com.erp.account.modules.salesorder.dto.request.SalesOrderUpdateRequest;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SalesOrderServiceUpdateTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private SalesOrderMapper salesOrderMapper;

    @InjectMocks
    private SalesOrderServiceImpl salesOrderService;

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    private UUID companyId;
    private UUID salesOrderId;
    private SalesOrder salesOrder;
    private SalesOrderItem item;

    @BeforeAll
    public static void setupTenantUtils() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
    }

    @AfterAll
    public static void teardownTenantUtils() {
        tenantUtilsMock.close();
    }

    @BeforeEach
    public void setup() {
        companyId = UUID.randomUUID();
        salesOrderId = UUID.randomUUID();

        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());

        salesOrder = new SalesOrder();
        salesOrder.setId(salesOrderId);
        salesOrder.setCompanyId(companyId);
        salesOrder.setStatus(SalesOrderStatus.DRAFT);
        salesOrder.setSubtotal(BigDecimal.valueOf(100));
        salesOrder.setTotalAmount(BigDecimal.valueOf(100));
        salesOrder.setItems(new ArrayList<>());

        item = new SalesOrderItem();
        item.setId(UUID.randomUUID());
        item.setQuantity(BigDecimal.valueOf(2));
        item.setUnitPrice(BigDecimal.valueOf(50));
        item.setDiscountPercent(BigDecimal.ZERO);
        item.setTaxAmount(BigDecimal.ZERO);
        
        salesOrder.addSalesOrderItem(item);
    }

    @Test
    public void updateSalesOrder_whenStatusConfirmed_shouldThrowException() {
        salesOrder.setStatus(SalesOrderStatus.CONFIRMED);
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, companyId))
                .thenReturn(Optional.of(salesOrder));

        SalesOrderUpdateRequest request = new SalesOrderUpdateRequest();
        request.setNotes("Updated Notes");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            salesOrderService.updateSalesOrder(companyId, salesOrderId, request);
        });
        
        assertEquals("Only DRAFT Sales Orders can be updated", exception.getMessage());
    }

    @Test
    public void updateSalesOrder_withLineItemUpdate_shouldRecalculateTotals() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, companyId))
                .thenReturn(Optional.of(salesOrder));
                
        SalesOrderResponse mockResponse = new SalesOrderResponse();
        mockResponse.setId(salesOrderId);
        when(salesOrderRepository.save(any(SalesOrder.class))).thenReturn(salesOrder);
        when(salesOrderMapper.toResponse(salesOrder)).thenReturn(mockResponse);

        SalesOrderUpdateRequest request = new SalesOrderUpdateRequest();
        SalesOrderItemUpdateRequest itemUpdate = new SalesOrderItemUpdateRequest();
        itemUpdate.setId(item.getId());
        itemUpdate.setQuantity(BigDecimal.valueOf(4)); // changing quantity from 2 to 4
        itemUpdate.setUnitPrice(BigDecimal.valueOf(50));
        request.setItems(List.of(itemUpdate));

        SalesOrderResponse response = salesOrderService.updateSalesOrder(companyId, salesOrderId, request);

        assertNotNull(response);
        verify(salesOrderRepository, times(1)).save(salesOrder);
        // Quantity 4 * 50 = 200 Subtotal
        assertEquals(BigDecimal.valueOf(200.0000).setScale(4), salesOrder.getSubtotal());
        assertEquals(BigDecimal.valueOf(200), salesOrder.getTotalAmount());
    }
}
