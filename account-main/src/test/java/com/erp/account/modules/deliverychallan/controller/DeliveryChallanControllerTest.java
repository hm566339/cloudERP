package com.erp.account.modules.deliverychallan.controller;

import com.erp.account.modules.deliverychallan.dto.request.DcFromReceiptRequest;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.service.DeliveryChallanService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryChallanControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DeliveryChallanService deliveryChallanService;

    @InjectMocks
    private DeliveryChallanController deliveryChallanController;

    private ObjectMapper objectMapper;

    private UUID receiptId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID companyId;

    @BeforeEach
    public void setup() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.standaloneSetup(deliveryChallanController).build();

        receiptId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        companyId = UUID.randomUUID();
    }

    @Test
    @DisplayName("POST /from-receipt/{receiptId} - Success returns 201 CREATED with DeliveryChallanResponse")
    public void testCreateFromReceipt_Success() throws Exception {
        DcFromReceiptRequest request = DcFromReceiptRequest.builder()
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        DeliveryChallanResponse mockResponse = new DeliveryChallanResponse();
        mockResponse.setId(UUID.randomUUID());
        mockResponse.setDcNumber("DC-2026-0001");
        mockResponse.setStatus(DeliveryChallanStatus.DRAFT);
        mockResponse.setDcDate(LocalDate.now());
        mockResponse.setSourceReceiptVoucherId(receiptId);
        mockResponse.setSourceReceiptVoucherNumber("RV-2026-0001");
        mockResponse.setSourceSalesInvoiceId(UUID.randomUUID());
        mockResponse.setSourceSalesInvoiceNumber("INV-2026-0001");
        mockResponse.setTotalAmount(new BigDecimal("1500.00"));
        mockResponse.setItems(Collections.emptyList());

        when(deliveryChallanService.createFromReceipt(eq(companyId), eq(receiptId), any(DcFromReceiptRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/account/v1/delivery-challans/from-receipt/{receiptId}", receiptId)
                        .param("companyId", companyId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Delivery Challan created successfully from Receipt Voucher"))
                .andExpect(jsonPath("$.data.dcNumber").value("DC-2026-0001"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.sourceReceiptVoucherId").value(receiptId.toString()))
                .andExpect(jsonPath("$.data.sourceReceiptVoucherNumber").value("RV-2026-0001"))
                .andExpect(jsonPath("$.data.sourceSalesInvoiceNumber").value("INV-2026-0001"));

        verify(deliveryChallanService).createFromReceipt(eq(companyId), eq(receiptId), any(DcFromReceiptRequest.class));
    }

    @Test
    @DisplayName("POST /{id}/confirm - Success returns 200 OK")
    public void testConfirmDeliveryChallan_Success() throws Exception {
        UUID dcId = UUID.randomUUID();

        mockMvc.perform(post("/api/account/v1/delivery-challans/{id}/confirm", dcId)
                        .param("companyId", companyId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Delivery Challan confirmed successfully"));

        verify(deliveryChallanService).confirmDeliveryChallan(eq(companyId), eq(dcId));
    }
}
