package com.erp.account.modules.purchaseorder.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderRequest;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.service.PurchaseOrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class PurchaseOrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PurchaseOrderService purchaseOrderService;

    @InjectMocks
    private PurchaseOrderController purchaseOrderController;

    private ObjectMapper objectMapper;
    private UUID poId;

    @BeforeEach
    public void setup() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(purchaseOrderController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        poId = UUID.randomUUID();
    }

    @Test
    public void testGetPurchaseOrderById() throws Exception {
        PurchaseOrderResponse response = PurchaseOrderResponse.builder()
                .id(poId)
                .poNumber("PO-2026-09-000001")
                .status(PurchaseOrderStatus.DRAFT)
                .build();

        when(purchaseOrderService.getPurchaseOrderById(any(), eq(poId))).thenReturn(response);

        mockMvc.perform(get("/api/account/purchase-orders/" + poId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.poNumber").value("PO-2026-09-000001"));
    }

    @Test
    public void testGetAllPurchaseOrders() {
        PurchaseOrderResponse response = PurchaseOrderResponse.builder()
                .id(poId)
                .poNumber("PO-2026-09-000001")
                .status(PurchaseOrderStatus.DRAFT)
                .build();

        when(purchaseOrderService.getAllPurchaseOrders(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(response)));

        var entity = purchaseOrderController.getAllPurchaseOrders(
                null, null, null, null, null, null, org.springframework.data.domain.PageRequest.of(0, 10));

        org.junit.jupiter.api.Assertions.assertEquals(org.springframework.http.HttpStatus.OK, entity.getStatusCode());
        org.junit.jupiter.api.Assertions.assertTrue(entity.getBody().isSuccess());
        org.junit.jupiter.api.Assertions.assertEquals(1, entity.getBody().getData().getContent().size());
        org.junit.jupiter.api.Assertions.assertEquals("PO-2026-09-000001", entity.getBody().getData().getContent().get(0).getPoNumber());
    }

    @Test
    public void testSubmitForApproval() throws Exception {
        PurchaseOrderResponse response = PurchaseOrderResponse.builder()
                .id(poId)
                .status(PurchaseOrderStatus.PENDING_APPROVAL)
                .build();

        when(purchaseOrderService.submitForApproval(any(), eq(poId))).thenReturn(response);

        mockMvc.perform(post("/api/account/purchase-orders/" + poId + "/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"));
    }

    @Test
    public void testApprovePurchaseOrder() throws Exception {
        PurchaseOrderResponse response = PurchaseOrderResponse.builder()
                .id(poId)
                .status(PurchaseOrderStatus.APPROVED)
                .build();

        when(purchaseOrderService.approvePurchaseOrder(any(), eq(poId))).thenReturn(response);

        mockMvc.perform(post("/api/account/purchase-orders/" + poId + "/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }

    @Test
    public void testDeletePurchaseOrder() throws Exception {
        mockMvc.perform(delete("/api/account/purchase-orders/" + poId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(purchaseOrderService).deletePurchaseOrder(any(), eq(poId));
    }
}
