package com.erp.crm.modules.pipeline.service.serviceImpl;

import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.pipeline.dto.request.OpportunityCreateRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityStageUpdateRequest;
import com.erp.crm.modules.pipeline.dto.response.OpportunityResponse;
import com.erp.crm.modules.pipeline.entity.CrmOpportunity;
import com.erp.crm.modules.pipeline.entity.CrmPipelineStage;
import com.erp.crm.modules.pipeline.entity.CrmSalesPipeline;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.enums.OpportunityDealType;
import com.erp.crm.modules.pipeline.enums.PipelineStageCategory;
import com.erp.crm.modules.pipeline.repository.*;
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
class CrmOpportunityServiceImplTest {

    @Mock
    private CrmOpportunityRepository opportunityRepository;
    @Mock
    private CrmOpportunityItemRepository itemRepository;
    @Mock
    private CrmOpportunityStageHistoryRepository stageHistoryRepository;
    @Mock
    private CrmSalesPipelineRepository pipelineRepository;
    @Mock
    private CrmPipelineStageRepository stageRepository;
    @Mock
    private CrmAccountRepository accountRepository;
    @Mock
    private CrmContactRepository contactRepository;
    @Mock
    private com.erp.crm.modules.automation.service.CrmAutomationEvaluatorService automationEvaluatorService;

    @InjectMocks
    private CrmOpportunityServiceImpl opportunityService;

    private UUID companyId;
    private UUID pipelineId;
    private UUID stageId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        pipelineId = UUID.randomUUID();
        stageId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Should create opportunity with weighted pipeline valuation")
    void testCreateOpportunity_Success() {
        CrmSalesPipeline pipeline = CrmSalesPipeline.builder()
                .id(pipelineId)
                .pipelineName("Standard Enterprise Sales")
                .build();
        when(pipelineRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, pipelineId))
                .thenReturn(Optional.of(pipeline));

        CrmPipelineStage stage = CrmPipelineStage.builder()
                .id(stageId)
                .pipelineId(pipelineId)
                .stageName("Proposal Sent")
                .stageCategory(PipelineStageCategory.PROPOSAL)
                .winProbabilityPct(50)
                .stageOrder(3)
                .build();
        when(stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(pipelineId))
                .thenReturn(List.of(stage));

        OpportunityCreateRequest request = OpportunityCreateRequest.builder()
                .opportunityName("ERP Modernization 2026")
                .pipelineId(pipelineId)
                .currentStageId(stageId)
                .dealValue(new BigDecimal("1000000.00")) // 10 Lakhs
                .dealType(OpportunityDealType.NEW_BUSINESS)
                .expectedCloseDate(LocalDate.now().plusMonths(1))
                .build();

        when(opportunityRepository.save(any(CrmOpportunity.class))).thenAnswer(inv -> {
            CrmOpportunity op = inv.getArgument(0);
            op.setId(UUID.randomUUID());
            return op;
        });

        OpportunityResponse response = opportunityService.createOpportunity(request, companyId);

        assertNotNull(response);
        assertEquals("ERP Modernization 2026", response.getOpportunityName());
        assertEquals(new BigDecimal("1000000.00"), response.getDealValue());
        assertEquals(50, response.getProbabilityPct());
        // 50% of 1,000,000 = 500,000 weighted
        assertEquals(new BigDecimal("500000.0000"), response.getWeightedValue());
        verify(opportunityRepository, times(1)).save(any(CrmOpportunity.class));
        verify(stageHistoryRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should advance stage and update win probability")
    void testUpdateStage_Success() {
        UUID oppId = UUID.randomUUID();
        UUID nextStageId = UUID.randomUUID();

        CrmOpportunity opp = CrmOpportunity.builder()
                .id(oppId)
                .opportunityName("Cloud Suite Upgrade")
                .pipelineId(pipelineId)
                .currentStageId(stageId)
                .dealValue(new BigDecimal("200000.00"))
                .probabilityPct(20)
                .dealStatus(OpportunityDealStatus.OPEN)
                .build();
        opp.setCompanyId(companyId);

        when(opportunityRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, oppId)).thenReturn(Optional.of(opp));

        CrmPipelineStage nextStage = CrmPipelineStage.builder()
                .id(nextStageId)
                .pipelineId(pipelineId)
                .stageName("Negotiation")
                .stageCategory(PipelineStageCategory.NEGOTIATION)
                .winProbabilityPct(80)
                .build();
        when(stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(pipelineId))
                .thenReturn(List.of(nextStage));

        CrmSalesPipeline pipeline = CrmSalesPipeline.builder()
                .id(pipelineId)
                .pipelineName("Standard Enterprise Sales")
                .build();
        when(pipelineRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, pipelineId))
                .thenReturn(Optional.of(pipeline));

        OpportunityStageUpdateRequest updateReq = OpportunityStageUpdateRequest.builder()
                .targetStageId(nextStageId)
                .reason("Customer agreed on scope, starting commercial negotiations")
                .build();

        when(opportunityRepository.save(any(CrmOpportunity.class))).thenReturn(opp);

        OpportunityResponse response = opportunityService.updateStage(oppId, updateReq, companyId);

        assertNotNull(response);
        assertEquals(nextStageId, opp.getCurrentStageId());
        assertEquals(80, opp.getProbabilityPct());
        verify(stageHistoryRepository, times(1)).save(any());
        verify(automationEvaluatorService, times(1)).evaluateAndExecute(
                eq(companyId), eq(com.erp.crm.modules.automation.enums.AutomationTrigger.OPPORTUNITY_STAGE_CHANGED), any(), eq(oppId), eq("OPPORTUNITY"));
    }
}
