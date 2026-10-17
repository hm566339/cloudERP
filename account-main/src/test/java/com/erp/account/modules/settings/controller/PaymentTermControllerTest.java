package com.erp.account.modules.settings.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.dto.request.PaymentTermRequestDTO;
import com.erp.account.modules.settings.dto.response.PaymentTermResponseDTO;
import com.erp.account.modules.settings.service.PaymentTermService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PaymentTermControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PaymentTermService service;

    @InjectMocks
    private PaymentTermController controller;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private UUID companyId;
    private UUID termId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        companyId = UUID.randomUUID();
        termId = UUID.randomUUID();
    }

    @Test
    void getAllPaymentTerms_WithHeaderCompanyId_Returns200() throws Exception {
        PaymentTermResponseDTO dto = PaymentTermResponseDTO.builder()
                .id(termId)
                .name("Net 30")
                .description("Payment due in 30 days")
                .documentType(SalesDocumentType.QUOTATION)
                .isDefault(true)
                .isActive(true)
                .build();

        when(service.getAllPaymentTerms(eq(companyId), eq(SalesDocumentType.QUOTATION)))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/account/v1/settings/payment-terms")
                        .header("X-Company-Id", companyId.toString())
                        .param("documentType", "QUOTATION")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(termId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("Net 30"));

        verify(service).getAllPaymentTerms(eq(companyId), eq(SalesDocumentType.QUOTATION));
    }

    @Test
    void getAllPaymentTerms_WithParamCompanyId_Returns200() throws Exception {
        when(service.getAllPaymentTerms(eq(companyId), eq(SalesDocumentType.QUOTATION)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/account/v1/settings/payment-terms")
                        .param("companyId", companyId.toString())
                        .param("documentType", "QUOTATION")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).getAllPaymentTerms(eq(companyId), eq(SalesDocumentType.QUOTATION));
    }

    @Test
    void getPaymentTermById_Returns200() throws Exception {
        PaymentTermResponseDTO dto = PaymentTermResponseDTO.builder()
                .id(termId)
                .name("Net 15")
                .description("Payment due in 15 days")
                .documentType(SalesDocumentType.QUOTATION)
                .isDefault(false)
                .isActive(true)
                .build();

        when(service.getPaymentTermById(eq(companyId), eq(termId))).thenReturn(dto);

        mockMvc.perform(get("/api/account/v1/settings/payment-terms/" + termId)
                        .header("X-Company-Id", companyId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Net 15"));

        verify(service).getPaymentTermById(eq(companyId), eq(termId));
    }

    @Test
    void createPaymentTerm_ValidRequest_Returns201() throws Exception {
        PaymentTermRequestDTO reqDto = PaymentTermRequestDTO.builder()
                .name("Net 60")
                .description("Payment due in 60 days")
                .documentType(SalesDocumentType.QUOTATION)
                .isDefault(false)
                .isActive(true)
                .build();

        RequestWrapper<PaymentTermRequestDTO> wrapper = new RequestWrapper<>(reqDto);

        PaymentTermResponseDTO resDto = PaymentTermResponseDTO.builder()
                .id(termId)
                .name("Net 60")
                .description("Payment due in 60 days")
                .documentType(SalesDocumentType.QUOTATION)
                .isDefault(false)
                .isActive(true)
                .build();

        when(service.createPaymentTerm(eq(companyId), any(PaymentTermRequestDTO.class))).thenReturn(resDto);

        mockMvc.perform(post("/api/account/v1/settings/payment-terms")
                        .header("X-Company-Id", companyId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrapper)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(termId.toString()))
                .andExpect(jsonPath("$.data.name").value("Net 60"));

        verify(service).createPaymentTerm(eq(companyId), any(PaymentTermRequestDTO.class));
    }

    @Test
    void updatePaymentTerm_ValidRequest_Returns200() throws Exception {
        PaymentTermRequestDTO reqDto = PaymentTermRequestDTO.builder()
                .name("Net 45 Updated")
                .description("Updated terms")
                .documentType(SalesDocumentType.QUOTATION)
                .isDefault(true)
                .isActive(true)
                .build();

        RequestWrapper<PaymentTermRequestDTO> wrapper = new RequestWrapper<>(reqDto);

        PaymentTermResponseDTO resDto = PaymentTermResponseDTO.builder()
                .id(termId)
                .name("Net 45 Updated")
                .description("Updated terms")
                .documentType(SalesDocumentType.QUOTATION)
                .isDefault(true)
                .isActive(true)
                .build();

        when(service.updatePaymentTerm(eq(companyId), eq(termId), any(PaymentTermRequestDTO.class))).thenReturn(resDto);

        mockMvc.perform(put("/api/account/v1/settings/payment-terms/" + termId)
                        .header("X-Company-Id", companyId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrapper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Net 45 Updated"));

        verify(service).updatePaymentTerm(eq(companyId), eq(termId), any(PaymentTermRequestDTO.class));
    }

    @Test
    void deletePaymentTerm_Returns200() throws Exception {
        mockMvc.perform(delete("/api/account/v1/settings/payment-terms/" + termId)
                        .header("X-Company-Id", companyId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).deletePaymentTerm(eq(companyId), eq(termId));
    }
}
