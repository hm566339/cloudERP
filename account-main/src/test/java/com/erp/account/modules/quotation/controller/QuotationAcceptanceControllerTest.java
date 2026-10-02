package com.erp.account.modules.quotation.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
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
}
