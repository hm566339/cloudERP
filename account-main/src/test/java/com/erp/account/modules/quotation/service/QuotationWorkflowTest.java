package com.erp.account.modules.quotation.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.mapper.QuotationMapper;
import com.erp.account.modules.quotation.service.impl.QuotationServiceImpl;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuotationWorkflowTest {

    @Mock
    private QuotationRepository quotationRepository;

    @Mock
    private QuotationMapper quotationMapper;

    @InjectMocks
    private QuotationServiceImpl quotationService;

    private UUID companyId;
    private UUID quotationId;
    private Quotation quotation;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        quotationId = UUID.randomUUID();

        quotation = new Quotation();
        quotation.setId(quotationId);
        quotation.setCompanyId(companyId);
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setIsDeleted(false);
    }

    @Test
    void testChangeStatus_DraftToSent_Success() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
            tenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());
            
            when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                    .thenReturn(Optional.of(quotation));
            
            assertDoesNotThrow(() -> {
                quotationService.changeStatus(companyId, quotationId, QuotationStatus.SENT);
            });
            assertEquals(QuotationStatus.SENT, quotation.getStatus());
        }
    }

    @Test
    void testChangeStatus_AcceptedToDraft_Fails() {
        quotation.setStatus(QuotationStatus.ACCEPTED);
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
            
            when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                    .thenReturn(Optional.of(quotation));
            
            BadRequestException exception = assertThrows(BadRequestException.class, () -> {
                quotationService.changeStatus(companyId, quotationId, QuotationStatus.DRAFT);
            });
            assertTrue(exception.getMessage().contains("Invalid status transition"));
        }
    }

    @Test
    void testChangeStatus_RejectedToAccepted_Fails() {
        quotation.setStatus(QuotationStatus.REJECTED);
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
            
            when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                    .thenReturn(Optional.of(quotation));
            
            assertThrows(BadRequestException.class, () -> {
                quotationService.changeStatus(companyId, quotationId, QuotationStatus.ACCEPTED);
            });
        }
    }

    @Test
    void testDeleteQuotation_Draft_Success() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
            
            when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                    .thenReturn(Optional.of(quotation));
            
            assertDoesNotThrow(() -> quotationService.deleteQuotation(companyId, quotationId));
            assertTrue(quotation.getIsDeleted());
        }
    }

    @Test
    void testDeleteQuotation_Accepted_Fails() {
        quotation.setStatus(QuotationStatus.ACCEPTED);
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
            
            when(quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                    .thenReturn(Optional.of(quotation));
            
            BadRequestException exception = assertThrows(BadRequestException.class, () -> {
                quotationService.deleteQuotation(companyId, quotationId);
            });
            assertTrue(exception.getMessage().contains("Only DRAFT quotations can be deleted"));
        }
    }

    @Test
    void testIsEditable_OnlyDraft() {
        quotation.setStatus(QuotationStatus.DRAFT);
        assertTrue(quotation.isEditable());

        quotation.setStatus(QuotationStatus.SENT);
        assertFalse(quotation.isEditable());

        quotation.setStatus(QuotationStatus.ACCEPTED);
        assertFalse(quotation.isEditable());

        quotation.setStatus(QuotationStatus.REJECTED);
        assertFalse(quotation.isEditable());

        quotation.setStatus(QuotationStatus.CANCELLED);
        assertFalse(quotation.isEditable());

        quotation.setStatus(QuotationStatus.EXPIRED);
        assertFalse(quotation.isEditable());
    }
}
