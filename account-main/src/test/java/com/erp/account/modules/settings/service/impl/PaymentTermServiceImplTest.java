package com.erp.account.modules.settings.service.impl;

import com.erp.account.modules.settings.dto.request.PaymentTermRequestDTO;
import com.erp.account.modules.settings.entity.PaymentTerm;
import com.erp.account.modules.settings.repository.PaymentTermRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentTermServiceImplTest {

    @Mock
    private PaymentTermRepository repository;

    @InjectMocks
    private PaymentTermServiceImpl service;

    private UUID companyId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        com.erp.account.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.account.security.CurrentUserContext.setUserId(UUID.randomUUID());
    }

    @Test
    void createPaymentTerm_WhenDefaultIsTrue_UnsetsExistingDefault() {
        PaymentTermRequestDTO request = PaymentTermRequestDTO.builder()
                .name("Net 30")
                .description("Pay within 30 days")
                .isDefault(true)
                .isActive(true)
                .build();

        PaymentTerm existingDefault = new PaymentTerm();
        existingDefault.setId(UUID.randomUUID());
        existingDefault.setIsDefault(true);

        when(repository.findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(any(UUID.class), any()))
                .thenReturn(Optional.of(existingDefault));
        
        when(repository.save(any(PaymentTerm.class))).thenAnswer(i -> {
            PaymentTerm pt = i.getArgument(0);
            if (pt.getId() == null) pt.setId(UUID.randomUUID());
            return pt;
        });

        service.createPaymentTerm(companyId, request);

        // Verify that existing default was unset and saved
        verify(repository, times(2)).save(any(PaymentTerm.class));
        assertFalse(existingDefault.getIsDefault());
    }

    @Test
    void createPaymentTerm_WhenDefaultIsFalse_DoesNotUnsetExisting() {
        PaymentTermRequestDTO request = PaymentTermRequestDTO.builder()
                .name("Net 15")
                .isDefault(false)
                .build();

        when(repository.save(any(PaymentTerm.class))).thenAnswer(i -> {
            PaymentTerm pt = i.getArgument(0);
            pt.setId(UUID.randomUUID());
            return pt;
        });

        service.createPaymentTerm(companyId, request);

        // Verify find default was not called
        verify(repository, never()).findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(any());
        verify(repository, times(1)).save(any(PaymentTerm.class));
    }
}
