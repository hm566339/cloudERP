package com.erp.crm.modules.quotation.service.serviceImpl;

import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.account.entity.CrmAccount;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.outbox.service.CrmOutboxService;
import com.erp.crm.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.crm.modules.quotation.dto.response.ConvertToSalesOrderResponse;
import com.erp.crm.modules.quotation.dto.response.QuotationResponse;
import com.erp.crm.modules.quotation.entity.CrmQuotation;
import com.erp.crm.modules.quotation.enums.DiscountType;
import com.erp.crm.modules.quotation.enums.QuotationApprovalStatus;
import com.erp.crm.modules.quotation.enums.QuotationStatus;
import com.erp.crm.modules.quotation.repository.CrmQuotationItemRepository;
import com.erp.crm.modules.quotation.repository.CrmQuotationRepository;
import com.erp.crm.modules.quotation.repository.CrmQuotationRevisionRepository;
import com.erp.crm.modules.setting.entity.CrmCompanySetting;
import com.erp.crm.modules.setting.repository.CrmCompanySettingRepository;
import com.erp.crm.modules.workflow.client.CrmWorkflowClient;
import com.erp.crm.modules.workflow.dto.WorkflowCallbackRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmQuotationServiceImplTest {

    @Mock
    private CrmQuotationRepository quotationRepository;
    @Mock
    private CrmQuotationItemRepository itemRepository;
    @Mock
    private CrmQuotationRevisionRepository revisionRepository;
    @Mock
    private CrmCompanySettingRepository companySettingRepository;
    @Mock
    private CrmAccountRepository accountRepository;
    @Mock
    private CrmContactRepository contactRepository;
    @Mock
    private CrmWorkflowClient workflowClient;
    @Mock
    private CrmOutboxService outboxService;

    @InjectMocks
    private CrmQuotationServiceImpl quotationService;

    private UUID companyId;
    private UUID accountId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        accountId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Should create Quotation and calculate line items correctly")
    void testCreateQuotation_Success() {
        CrmCompanySetting setting = CrmCompanySetting.builder()
                .discountApprovalThreshold(new BigDecimal("15.00"))
                .build();
        when(companySettingRepository.findByCompanyIdAndIsDeletedFalse(companyId)).thenReturn(Optional.of(setting));

        QuotationCreateRequest.ItemRequest itemReq = QuotationCreateRequest.ItemRequest.builder()
                .productName("Cloud ERP Software License")
                .hsnSacCode("998313")
                .quantity(new BigDecimal("2.0000"))
                .unitPrice(new BigDecimal("10000.0000"))
                .discountPct(new BigDecimal("10.0000")) // 10% discount -> taxable 18,000
                .cgstRate(new BigDecimal("9.00"))        // 9% CGST (1620)
                .sgstRate(new BigDecimal("9.00"))        // 9% SGST (1620)
                .build();

        QuotationCreateRequest request = QuotationCreateRequest.builder()
                .accountId(accountId)
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(30))
                .placeOfSupplyStateCode("27")
                .discountType(DiscountType.PERCENTAGE)
                .discountPct(BigDecimal.ZERO)
                .items(List.of(itemReq))
                .build();

        when(quotationRepository.save(any(CrmQuotation.class))).thenAnswer(inv -> {
            CrmQuotation q = inv.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        QuotationResponse response = quotationService.createQuotation(request, companyId);

        assertNotNull(response);
        assertEquals(QuotationStatus.DRAFT, response.getStatus());
        assertEquals(0, new BigDecimal("18000.00").compareTo(response.getSubtotal()));
        assertEquals(0, new BigDecimal("3240.00").compareTo(response.getTaxAmount()));
        assertEquals(0, new BigDecimal("21240.00").compareTo(response.getTotalAmount()));
        assertFalse(response.getDiscountApprovalRequired());
        verify(quotationRepository, times(1)).save(any(CrmQuotation.class));
        verify(itemRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should require approval when discount exceeds threshold (e.g. 20% > 15%)")
    void testCreateQuotation_ExceedsDiscountThreshold_RequiresApproval() {
        CrmCompanySetting setting = CrmCompanySetting.builder()
                .discountApprovalThreshold(new BigDecimal("15.00"))
                .build();
        when(companySettingRepository.findByCompanyIdAndIsDeletedFalse(companyId)).thenReturn(Optional.of(setting));

        QuotationCreateRequest.ItemRequest itemReq = QuotationCreateRequest.ItemRequest.builder()
                .productName("Custom Manufacturing Software")
                .hsnSacCode("998314")
                .quantity(new BigDecimal("1.0000"))
                .unitPrice(new BigDecimal("50000.0000"))
                .discountPct(new BigDecimal("20.0000")) // 20% discount exceeds 15% threshold!
                .cgstRate(BigDecimal.ZERO)
                .sgstRate(BigDecimal.ZERO)
                .build();

        QuotationCreateRequest request = QuotationCreateRequest.builder()
                .accountId(accountId)
                .quotationDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(30))
                .placeOfSupplyStateCode("27")
                .discountType(DiscountType.PERCENTAGE)
                .discountPct(new BigDecimal("20.0000"))
                .items(List.of(itemReq))
                .build();

        when(quotationRepository.save(any(CrmQuotation.class))).thenAnswer(inv -> {
            CrmQuotation q = inv.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        QuotationResponse response = quotationService.createQuotation(request, companyId);

        assertNotNull(response);
        assertEquals(QuotationStatus.PENDING_APPROVAL, response.getStatus());
        assertEquals(QuotationApprovalStatus.PENDING, response.getApprovalStatus());
        assertTrue(response.getDiscountApprovalRequired());
    }

    @Test
    @DisplayName("Should process Workflow Callback when quotation approval is granted")
    void testProcessWorkflowCallback_Approved() {
        UUID quoteId = UUID.randomUUID();
        CrmQuotation quotation = CrmQuotation.builder()
                .id(quoteId)
                .quotationNumber("QT-2026-0001")
                .approvalStatus(QuotationApprovalStatus.PENDING)
                .status(QuotationStatus.PENDING_APPROVAL)
                .build();
        quotation.setCompanyId(companyId);

        when(quotationRepository.findById(quoteId)).thenReturn(Optional.of(quotation));

        WorkflowCallbackRequest callback = WorkflowCallbackRequest.builder()
                .documentId(quoteId)
                .documentType("QUOTATION")
                .action("APPROVE")
                .status("APPROVED")
                .comments("Approved by Sales Director")
                .build();

        quotationService.handleWorkflowCallback(callback);

        assertEquals(QuotationApprovalStatus.APPROVED, quotation.getApprovalStatus());
        assertEquals(QuotationStatus.APPROVED, quotation.getStatus());
        verify(quotationRepository, times(1)).save(quotation);
        verify(outboxService, times(1)).publishEvent(eq(companyId), eq("QUOTATION"), eq(quoteId), eq("QUOTATION_WORKFLOW_RESOLVED"), any());
    }

    @Test
    @DisplayName("Should convert approved quotation to Sales Order and publish Outbox event")
    void testConvertToSalesOrder_Success() {
        UUID quoteId = UUID.randomUUID();
        CrmQuotation quotation = CrmQuotation.builder()
                .id(quoteId)
                .quotationNumber("QT-2026-0002")
                .approvalStatus(QuotationApprovalStatus.APPROVED)
                .status(QuotationStatus.APPROVED)
                .build();
        quotation.setCompanyId(companyId);

        when(quotationRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, quoteId))
                .thenReturn(Optional.of(quotation));

        ConvertToSalesOrderResponse orderResponse = quotationService.convertToSalesOrder(quoteId, companyId);

        assertNotNull(orderResponse);
        assertEquals(quoteId, orderResponse.getQuotationId());
        assertEquals(QuotationStatus.CONVERTED_TO_ORDER, quotation.getStatus());
        assertNotNull(quotation.getAccountMainSalesOrderId());
        verify(quotationRepository, times(1)).save(quotation);
        verify(outboxService, times(1)).publishEvent(eq(companyId), eq("QUOTATION"), eq(quoteId), eq("QUOTATION_CONVERTED_TO_ORDER"), any());
    }
}
