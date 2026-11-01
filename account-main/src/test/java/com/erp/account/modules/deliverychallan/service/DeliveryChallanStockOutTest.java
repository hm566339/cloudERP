package com.erp.account.modules.deliverychallan.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.InventoryStockOutException;
import com.erp.account.common.dto.inventory.response.DeliveryChallanStockOutResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanItem;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.mapper.DeliveryChallanMapper;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.deliverychallan.service.impl.DeliveryChallanServiceImpl;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryChallanStockOutTest {

        @Mock
        private DeliveryChallanRepository deliveryChallanRepository;

        @Mock
        private com.erp.account.modules.deliverychallan.repository.DeliveryChallanItemRepository deliveryChallanItemRepository;

        @Mock
        private SalesOrderRepository salesOrderRepository;

        @Mock
        private DeliveryChallanMapper deliveryChallanMapper;

        @Mock
        private VoucherSequenceService voucherSequenceService;

        @Mock
        private InventoryIntegrationService inventoryIntegrationService;

        @Mock
        private com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository receiptVoucherRepository;

        @Mock
    private com.erp.account.integration.workflow.client.WorkflowClient workflowClient;

    @InjectMocks
        private DeliveryChallanServiceImpl deliveryChallanService;

        private MockedStatic<TenantUtils> tenantUtilsMock;

        private UUID companyId;
        private UUID dcId;
        private DeliveryChallan dc;

        @BeforeEach
        void setUp() {
                tenantUtilsMock = mockStatic(TenantUtils.class);
                tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

                companyId = UUID.randomUUID();
                dcId = UUID.randomUUID();

                DeliveryChallanItem item = DeliveryChallanItem.builder()
                                .id(UUID.randomUUID())
                                .companyId(companyId)
                                .itemId(UUID.randomUUID())
                                .itemName("Finished Product A")
                                .quantity(new BigDecimal("10.0000"))
                                .unit("PCS")
                                .unitPrice(new BigDecimal("100.0000"))
                                .warehouseId(UUID.randomUUID())
                                .locationId(UUID.randomUUID())
                                .build();

                dc = DeliveryChallan.builder()
                                .id(dcId)
                                .companyId(companyId)
                                .dcNumber("DC-2026-09-000001")
                                .dcDate(LocalDate.now())
                                .status(DeliveryChallanStatus.DRAFT)
                                .items(new ArrayList<>(List.of(item)))
                                .build();
        }

        @AfterEach
        void tearDown() {
                if (tenantUtilsMock != null) {
                        tenantUtilsMock.close();
                }
        }

        @Test
        @DisplayName("Should successfully confirm Delivery Challan and trigger inventory stock OUT")
        void confirmDeliveryChallan_success() {
                when(deliveryChallanRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(dcId, companyId))
                                .thenReturn(Optional.of(dc));
                when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));

                DeliveryChallanStockOutResponse stockOutResponse = DeliveryChallanStockOutResponse.builder()
                                .inventoryTransactionId(UUID.randomUUID())
                                .status("POSTED")
                                .movementType("OUT")
                                .dcNumber("DC-2026-09-000001")
                                .totalQuantity(new BigDecimal("10.0000"))
                                .build();

                when(inventoryIntegrationService.processDeliveryChallanStockOut(dc, companyId))
                                .thenReturn(stockOutResponse);

                deliveryChallanService.confirmDeliveryChallan(companyId, dcId);

                // Verify inventory service was called with Delivery Challan
                verify(inventoryIntegrationService, times(1)).processDeliveryChallanStockOut(dc, companyId);

                // Verify DC status updated to CONFIRMED and saved
                assertEquals(DeliveryChallanStatus.CONFIRMED, dc.getStatus());
                verify(deliveryChallanRepository, times(1)).save(dc);
        }

        @Test
        @DisplayName("Should throw BadRequestException if Delivery Challan is not in DRAFT status")
        void confirmDeliveryChallan_alreadyConfirmed_throwsBadRequest() {
                dc.setStatus(DeliveryChallanStatus.CONFIRMED);
                when(deliveryChallanRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(dcId, companyId))
                                .thenReturn(Optional.of(dc));

                BadRequestException ex = assertThrows(BadRequestException.class,
                                () -> deliveryChallanService.confirmDeliveryChallan(companyId, dcId));

                assertEquals("Delivery Challan is not in DRAFT or APPROVED status.", ex.getMessage());
                verify(inventoryIntegrationService, never()).processDeliveryChallanStockOut(any(), any());
                verify(deliveryChallanRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should fail confirmation and not confirm DC if inventory stock OUT fails (e.g., insufficient stock)")
        void confirmDeliveryChallan_inventoryFails_throwsAndPreventsConfirmation() {
                when(deliveryChallanRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(dcId, companyId))
                                .thenReturn(Optional.of(dc));

                doThrow(new InventoryStockOutException(
                                "Cannot confirm Delivery Challan: Insufficient available stock for product"))
                                .when(inventoryIntegrationService).processDeliveryChallanStockOut(dc, companyId);

                InventoryStockOutException ex = assertThrows(InventoryStockOutException.class,
                                () -> deliveryChallanService.confirmDeliveryChallan(companyId, dcId));

                assertTrue(ex.getMessage().contains("Insufficient available stock"));

                // Verify DC status remained DRAFT and was never saved as CONFIRMED
                assertEquals(DeliveryChallanStatus.DRAFT, dc.getStatus());
                verify(deliveryChallanRepository, never()).save(any());
        }
}
