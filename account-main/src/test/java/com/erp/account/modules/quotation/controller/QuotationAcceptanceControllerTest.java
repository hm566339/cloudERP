package com.erp.account.modules.quotation.controller;

import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.dto.response.QuotationPublicViewResponse;
import com.erp.account.modules.quotation.dto.response.QuotationRejectResponse;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class QuotationAcceptanceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private QuotationAcceptanceTokenService tokenService;

    @InjectMocks
    private QuotationAcceptanceController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getPublicQuotation_ValidToken_Returns200() throws Exception {
        QuotationPublicViewResponse response = QuotationPublicViewResponse.builder()
                .quotationNumber("QTN-2026-101")
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(7))
                .status("SENT")
                .companyName("Acme Corp")
                .customerName("Beta Inc")
                .items(Collections.emptyList())
                .subtotal(new BigDecimal("1000.00"))
                .taxAmount(new BigDecimal("180.00"))
                .totalAmount(new BigDecimal("1180.00"))
                .build();

        when(tokenService.getPublicQuotation("valid-token")).thenReturn(response);

        mockMvc.perform(get("/api/account/v1/quotations/public/valid-token")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.quotationNumber").value("QTN-2026-101"))
                .andExpect(jsonPath("$.data.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.data.totalAmount").value(1180.00));
    }

    @Test
    void acceptQuotationPublic_ValidToken_Returns200() throws Exception {
        QuotationAcceptResponse response = QuotationAcceptResponse.builder()
                .success(true)
                .message("Quotation accepted successfully")
                .quotationId(UUID.randomUUID())
                .acceptedAt(LocalDateTime.now())
                .build();

        when(tokenService.acceptQuotation(anyString())).thenReturn(response);

        mockMvc.perform(post("/api/account/v1/quotations/public/accept/valid-token")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Quotation accepted successfully"))
                .andExpect(jsonPath("$.data.success").value(true));
    }

    @Test
    void rejectQuotationPublic_ValidToken_Returns200() throws Exception {
        QuotationRejectResponse response = QuotationRejectResponse.builder()
                .success(true)
                .message("Quotation declined successfully")
                .quotationId(UUID.randomUUID())
                .rejectedAt(LocalDateTime.now())
                .build();

        when(tokenService.rejectQuotation(anyString(), any())).thenReturn(response);

        mockMvc.perform(post("/api/account/v1/quotations/public/reject/valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Requirements changed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Quotation declined successfully"))
                .andExpect(jsonPath("$.data.success").value(true));
    }
}
