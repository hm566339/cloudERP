package com.erp.account.modules.quotation.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
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

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuotationAcceptanceTokenServiceTest {

    @Mock
    private QuotationAcceptanceTokenRepository tokenRepository;

    @Mock
    private QuotationRepository quotationRepository;

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

        String rawToken = tokenService.generateToken(quotation);

        assertNotNull(rawToken);
        ArgumentCaptor<QuotationAcceptanceToken> captor = ArgumentCaptor.forClass(QuotationAcceptanceToken.class);
        verify(tokenRepository).save(captor.capture());

        QuotationAcceptanceToken savedToken = captor.getValue();
        assertEquals(quotation.getId(), savedToken.getQuotationId());
        assertNotNull(savedToken.getTokenHash());
        assertNotNull(savedToken.getExpiresAt());
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

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

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

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> tokenService.acceptQuotation("token"));
    }
    
    @Test
    void acceptQuotation_AlreadyUsedToken_ShouldReturnIdempotentSuccess() {
        QuotationAcceptanceToken token = new QuotationAcceptanceToken();
        token.setExpiresAt(LocalDateTime.now().plusDays(1));
        token.setUsedAt(LocalDateTime.now().minusMinutes(5));
        token.setQuotationId(UUID.randomUUID());

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        QuotationAcceptResponse response = tokenService.acceptQuotation("token");
        assertFalse(response.isSuccess());
        assertEquals("Quotation has already been accepted", response.getMessage());
    }
}
