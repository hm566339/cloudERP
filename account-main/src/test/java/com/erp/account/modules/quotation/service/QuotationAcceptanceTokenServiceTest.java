package com.erp.account.modules.quotation.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.dto.response.QuotationPublicViewResponse;
import com.erp.account.modules.quotation.dto.response.QuotationRejectResponse;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationAcceptanceTokenRepository;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.impl.QuotationAcceptanceTokenServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuotationAcceptanceTokenServiceTest {

    @Mock
    private QuotationAcceptanceTokenRepository tokenRepository;

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private com.erp.account.modules.salesorder.service.SalesOrderService salesOrderService;

    @Mock
    private com.erp.account.modules.salesorder.repository.SalesOrderRepository salesOrderRepository;

    @Mock
    private com.erp.account.integration.workflow.client.WorkflowServiceClient workflowServiceClient;

    @InjectMocks
    private QuotationAcceptanceTokenServiceImpl tokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tokenService, "expiryDays", 7);
    }

    @Test
    void generateToken_ShouldSaveAndReturnRawToken() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setQuotationNumber("QTN-2026-001");
        quotation.setValidUntil(LocalDate.now().plusDays(15));

        String rawToken = tokenService.generateToken(quotation);

        assertNotNull(rawToken);
        ArgumentCaptor<QuotationAcceptanceToken> captor = ArgumentCaptor.forClass(QuotationAcceptanceToken.class);
        verify(tokenRepository).save(captor.capture());

        QuotationAcceptanceToken savedToken = captor.getValue();
        assertEquals(quotation.getId(), savedToken.getQuotationId());
        assertNotNull(savedToken.getTokenHash());
        assertNotNull(savedToken.getExpiresAt());
        assertEquals(LocalDate.now().plusDays(15), savedToken.getExpiresAt().toLocalDate());
    }

    @Test
    void generateToken_ExpiredQuotation_ShouldThrowException() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setValidUntil(LocalDate.now().minusDays(1));

        assertThrows(BadRequestException.class, () -> tokenService.generateToken(quotation));
    }

    @Test
    void getOrCreateToken_ShouldReuseCachedToken() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setQuotationNumber("QTN-2026-002");
        quotation.setValidUntil(LocalDate.now().plusDays(5));

        String token1 = tokenService.generateToken(quotation);

        QuotationAcceptanceToken activeToken = QuotationAcceptanceToken.builder()
                .quotationId(quotation.getId())
                .expiresAt(LocalDateTime.now().plusDays(5))
                .build();
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(activeToken));

        String token2 = tokenService.getOrCreateToken(quotation);

        assertEquals(token1, token2);
        // Only one save call from the first generateToken
        verify(tokenRepository, times(1)).save(any(QuotationAcceptanceToken.class));
    }

    @Test
    void acceptQuotation_ValidToken_ShouldAcceptQuotation() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setStatus(QuotationStatus.SENT);

        QuotationAcceptanceToken token = new QuotationAcceptanceToken();
        token.setId(UUID.randomUUID());
        token.setQuotationId(quotation.getId());
        token.setQuotation(quotation);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        String rawToken = "dummyRawToken";

        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(token));

        QuotationAcceptResponse response = tokenService.acceptQuotation(rawToken);

        assertTrue(response.isSuccess());
        assertEquals(quotation.getId(), response.getQuotationId());
        assertEquals(QuotationStatus.ACCEPTED, quotation.getStatus());
        assertNotNull(quotation.getApprovedAt());
        assertNotNull(token.getUsedAt());

        verify(quotationRepository).save(quotation);
        verify(tokenRepository).save(token);
    }

    @Test
    void acceptQuotation_ExpiredToken_ShouldThrowException() {
        QuotationAcceptanceToken token = new QuotationAcceptanceToken();
        token.setExpiresAt(LocalDateTime.now().minusDays(1));

        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> tokenService.acceptQuotation("token"));
    }

    @Test
    void acceptQuotation_AlreadyUsedToken_ShouldReturnIdempotentResponse() {
        QuotationAcceptanceToken token = new QuotationAcceptanceToken();
        token.setExpiresAt(LocalDateTime.now().plusDays(1));
        token.setUsedAt(LocalDateTime.now().minusMinutes(5));
        token.setQuotationId(UUID.randomUUID());

        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(token));

        QuotationAcceptResponse response = tokenService.acceptQuotation("token");
        assertFalse(response.isSuccess());
        assertEquals("Quotation has already been accepted", response.getMessage());
    }

    @Test
    void rejectQuotation_ValidToken_ShouldRejectQuotation() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setStatus(QuotationStatus.SENT);

        QuotationAcceptanceToken token = new QuotationAcceptanceToken();
        token.setId(UUID.randomUUID());
        token.setQuotationId(quotation.getId());
        token.setQuotation(quotation);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(token));

        QuotationRejectResponse response = tokenService.rejectQuotation("dummyToken", "Price is higher than budget");

        assertTrue(response.isSuccess());
        assertEquals(QuotationStatus.REJECTED, quotation.getStatus());
        assertTrue(quotation.getNotes().contains("Price is higher than budget"));
        assertNotNull(token.getUsedAt());

        verify(quotationRepository).save(quotation);
        verify(tokenRepository).save(token);
    }

    @Test
    void rejectQuotation_AlreadyAccepted_ShouldThrowBadRequest() {
        Quotation quotation = new Quotation();
        quotation.setId(UUID.randomUUID());
        quotation.setStatus(QuotationStatus.ACCEPTED);

        QuotationAcceptanceToken token = new QuotationAcceptanceToken();
        token.setId(UUID.randomUUID());
        token.setQuotationId(quotation.getId());
        token.setQuotation(quotation);
        token.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(tokenRepository.findByTokenHashWithLock(anyString())).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> tokenService.rejectQuotation("dummyToken", "Declining"));
    }

    @Test
    void getPublicQuotation_ValidToken_ShouldReturnSanitizedDto() {
        UUID quotationId = UUID.randomUUID();
        Company company = Company.builder()
                .legalName("Acme Enterprise")
                .gstin("27AABCU9603R1ZM")
                .build();
        Customer customer = Customer.builder()
                .customerName("Global Tech")
                .gstin("27AAACG0564C1Z9")
                .build();

        QuotationItem item = QuotationItem.builder()
                .itemName("Consulting Service")
                .quantity(new BigDecimal("10.00"))
                .unitPrice(new BigDecimal("5000.00"))
                .taxAmount(new BigDecimal("9000.00"))
                .totalAmount(new BigDecimal("59000.00"))
                .build();

        Quotation quotation = Quotation.builder()
                .quotationNumber("QTN-2026-999")
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(10))
                .status(QuotationStatus.SENT)
                .quotationCurrency("INR")
                .company(company)
                .customer(customer)
                .quotationItems(Set.of(item))
                .subtotal(new BigDecimal("50000.00"))
                .taxAmount(new BigDecimal("9000.00"))
                .totalAmount(new BigDecimal("59000.00"))
                .build();
        quotation.setId(quotationId);

        QuotationAcceptanceToken token = QuotationAcceptanceToken.builder()
                .id(UUID.randomUUID())
                .quotationId(quotationId)
                .quotation(quotation)
                .expiresAt(LocalDateTime.now().plusDays(10))
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        QuotationPublicViewResponse response = tokenService.getPublicQuotation("dummyToken");

        assertNotNull(response);
        assertEquals("QTN-2026-999", response.getQuotationNumber());
        assertEquals("Acme Enterprise", response.getCompanyName());
        assertEquals("Global Tech", response.getCustomerName());
        assertEquals(1, response.getItems().size());
        assertEquals("Consulting Service", response.getItems().get(0).getItemName());
        assertEquals(new BigDecimal("59000.00"), response.getTotalAmount());
        assertFalse(response.isAccepted());
        assertFalse(response.isExpired());
    }

    @Test
    void revokeTokensForQuotation_ShouldCallRepository() {
        UUID quotationId = UUID.randomUUID();
        tokenService.revokeTokensForQuotation(quotationId);
        verify(tokenRepository).revokeActiveTokensByQuotationId(eq(quotationId), any(LocalDateTime.class));
    }
}
