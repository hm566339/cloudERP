package com.erp.crm.modules.pipeline.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.pipeline.dto.request.OpportunityCloseRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityCreateRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityStageUpdateRequest;
import com.erp.crm.modules.pipeline.dto.response.KanbanViewResponse;
import com.erp.crm.modules.pipeline.dto.response.OpportunityResponse;
import com.erp.crm.modules.pipeline.entity.CrmOpportunity;
import com.erp.crm.modules.pipeline.entity.CrmOpportunityItem;
import com.erp.crm.modules.pipeline.entity.CrmOpportunityStageHistory;
import com.erp.crm.modules.pipeline.entity.CrmPipelineStage;
import com.erp.crm.modules.pipeline.entity.CrmSalesPipeline;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.repository.*;
import com.erp.crm.modules.pipeline.service.CrmOpportunityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmOpportunityServiceImpl implements CrmOpportunityService {

    private final CrmOpportunityRepository opportunityRepository;
    private final CrmOpportunityItemRepository itemRepository;
    private final CrmOpportunityStageHistoryRepository stageHistoryRepository;
    private final CrmSalesPipelineRepository pipelineRepository;
    private final CrmPipelineStageRepository stageRepository;
    private final CrmAccountRepository accountRepository;
    private final CrmContactRepository contactRepository;
    private final com.erp.crm.modules.automation.service.CrmAutomationEvaluatorService automationEvaluatorService;

    @Override
    public OpportunityResponse createOpportunity(OpportunityCreateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Creating Opportunity: {} for companyId: {}", request.getOpportunityName(), companyId);

        CrmSalesPipeline pipeline = pipelineRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, request.getPipelineId())
                .orElseThrow(() -> new ResourceNotFoundException("Sales pipeline not found with id: " + request.getPipelineId()));

        final UUID targetStageId = (request.getCurrentStageId() != null)
                ? request.getCurrentStageId()
                : stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(pipeline.getId())
                        .stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("No stages configured for pipeline: " + request.getPipelineId()))
                        .getId();

        CrmPipelineStage stage = stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(pipeline.getId())
                .stream().filter(s -> s.getId().equals(targetStageId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found in pipeline: " + targetStageId));

        int prob = request.getProbabilityPct() != null ? request.getProbabilityPct() : stage.getWinProbabilityPct();
        BigDecimal weighted = request.getDealValue().multiply(BigDecimal.valueOf(prob))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        CrmOpportunity opp = CrmOpportunity.builder()
                .opportunityCode(generateOpportunityCode())
                .opportunityName(request.getOpportunityName())
                .pipelineId(request.getPipelineId())
                .currentStageId(stage.getId())
                .accountId(request.getAccountId())
                .primaryContactId(request.getPrimaryContactId())
                .originLeadId(request.getOriginLeadId())
                .dealValue(request.getDealValue())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .expectedCloseDate(request.getExpectedCloseDate())
                .probabilityPct(prob)
                .weightedValue(weighted)
                .ownerUserId(request.getOwnerUserId() != null ? request.getOwnerUserId() : TenantUtils.getCurrentUserId())
                .assignedTeamId(request.getAssignedTeamId())
                .dealType(request.getDealType())
                .dealStatus(OpportunityDealStatus.OPEN)
                .build();
        opp.setCompanyId(companyId);
        CrmOpportunity savedOpp = opportunityRepository.save(opp);

        // Save Items
        if (request.getItems() != null) {
            for (OpportunityCreateRequest.ItemRequest itemReq : request.getItems()) {
                BigDecimal qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : BigDecimal.ONE;
                BigDecimal price = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal total = qty.multiply(price);

                CrmOpportunityItem item = CrmOpportunityItem.builder()
                        .opportunityId(savedOpp.getId())
                        .productId(itemReq.getProductId())
                        .productCode(itemReq.getProductCode())
                        .productName(itemReq.getProductName())
                        .description(itemReq.getDescription())
                        .quantity(qty)
                        .uom(itemReq.getUom() != null ? itemReq.getUom() : "PCS")
                        .unitPrice(price)
                        .discountPct(itemReq.getDiscountPct() != null ? itemReq.getDiscountPct() : BigDecimal.ZERO)
                        .taxPct(itemReq.getTaxPct() != null ? itemReq.getTaxPct() : new BigDecimal("18.00"))
                        .totalAmount(total)
                        .build();
                item.setCompanyId(companyId);
                itemRepository.save(item);
            }
        }

        // Log Initial Stage History
        stageHistoryRepository.save(CrmOpportunityStageHistory.builder()
                .companyId(companyId)
                .opportunityId(savedOpp.getId())
                .toStageId(stage.getId())
                .stageEntryAt(LocalDateTime.now())
                .changedByUserId(TenantUtils.getCurrentUserId())
                .reasonForChange("Opportunity created")
                .build());

        return enrichResponse(savedOpp);
    }

    @Override
    @Transactional(readOnly = true)
    public OpportunityResponse getOpportunityById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmOpportunity opp = opportunityRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));
        return enrichResponse(opp);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OpportunityResponse> getAllOpportunities(UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return opportunityRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable)
                .map(this::enrichResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public KanbanViewResponse getKanbanView(UUID pipelineId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        UUID effectivePipelineId = pipelineId;
        if (effectivePipelineId == null) {
            effectivePipelineId = pipelineRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(companyId)
                    .map(com.erp.crm.modules.pipeline.entity.CrmSalesPipeline::getId)
                    .or(() -> pipelineRepository.findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(companyId).stream().map(com.erp.crm.modules.pipeline.entity.CrmSalesPipeline::getId).findFirst())
                    .orElse(null);
        }

        if (effectivePipelineId == null) {
            return KanbanViewResponse.builder()
                    .pipelineId(null)
                    .pipelineName("Default Pipeline")
                    .columns(new ArrayList<>())
                    .totalDeals(0)
                    .totalPipelineValue(BigDecimal.ZERO)
                    .build();
        }

        final UUID finalPipelineId = effectivePipelineId;
        var pipeline = pipelineRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, finalPipelineId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline not found: " + finalPipelineId));

        List<CrmPipelineStage> stages = stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(finalPipelineId);
        List<KanbanViewResponse.KanbanStage> kanbanStages = new ArrayList<>();

        for (CrmPipelineStage stage : stages) {
            List<CrmOpportunity> stageDeals = opportunityRepository.findByCompanyIdAndPipelineIdAndCurrentStageIdAndIsDeletedFalse(
                    companyId, finalPipelineId, stage.getId());

            BigDecimal stageTotal = BigDecimal.ZERO;
            List<KanbanViewResponse.KanbanDeal> deals = new ArrayList<>();
            for (CrmOpportunity opp : stageDeals) {
                stageTotal = stageTotal.add(opp.getDealValue());
                String accName = opp.getAccountId() != null
                        ? accountRepository.findById(opp.getAccountId()).map(a -> a.getAccountName()).orElse("")
                        : "";
                deals.add(KanbanViewResponse.KanbanDeal.builder()
                        .id(opp.getId())
                        .opportunityCode(opp.getOpportunityCode())
                        .opportunityName(opp.getOpportunityName())
                        .accountName(accName)
                        .dealValue(opp.getDealValue())
                        .weightedValue(opp.getWeightedValue())
                        .expectedCloseDate(opp.getExpectedCloseDate())
                        .isRotting(false)
                        .build());
            }

            kanbanStages.add(KanbanViewResponse.KanbanStage.builder()
                    .stageId(stage.getId())
                    .stageName(stage.getStageName())
                    .stageOrder(stage.getStageOrder())
                    .winProbabilityPct(stage.getWinProbabilityPct())
                    .totalValue(stageTotal)
                    .dealCount(deals.size())
                    .deals(deals)
                    .build());
        }

        return KanbanViewResponse.builder()
                .pipelineId(pipeline.getId())
                .pipelineName(pipeline.getPipelineName())
                .stages(kanbanStages)
                .build();
    }

    @Override
    public OpportunityResponse updateStage(UUID id, OpportunityStageUpdateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmOpportunity opp = opportunityRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        CrmPipelineStage targetStage = stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(opp.getPipelineId())
                .stream().filter(s -> s.getId().equals(request.getTargetStageId())).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Target stage does not belong to pipeline: " + request.getTargetStageId()));

        UUID prevStageId = opp.getCurrentStageId();
        opp.setCurrentStageId(targetStage.getId());
        opp.setProbabilityPct(targetStage.getWinProbabilityPct());
        opp.setWeightedValue(opp.getDealValue().multiply(BigDecimal.valueOf(targetStage.getWinProbabilityPct()))
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));

        stageHistoryRepository.save(CrmOpportunityStageHistory.builder()
                .companyId(companyId)
                .opportunityId(opp.getId())
                .fromStageId(prevStageId)
                .toStageId(targetStage.getId())
                .stageEntryAt(LocalDateTime.now())
                .changedByUserId(TenantUtils.getCurrentUserId())
                .reasonForChange(request.getReason())
                .build());

        CrmOpportunity savedOpp = opportunityRepository.save(opp);

        // Trigger automation evaluation for OPPORTUNITY_STAGE_CHANGED
        if (automationEvaluatorService != null) {
            try {
                automationEvaluatorService.evaluateAndExecute(companyId,
                        com.erp.crm.modules.automation.enums.AutomationTrigger.OPPORTUNITY_STAGE_CHANGED,
                        savedOpp, savedOpp.getId(), "OPPORTUNITY");
            } catch (Exception e) {
                log.warn("Automation execution failed on opportunity stage change [{}]: {}", savedOpp.getId(), e.getMessage());
            }
        }

        return enrichResponse(savedOpp);
    }

    @Override
    public OpportunityResponse closeOpportunity(UUID id, OpportunityCloseRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmOpportunity opp = opportunityRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        opp.setDealStatus(request.getStatus());
        if (request.getStatus() == OpportunityDealStatus.WON) {
            opp.setWonAt(LocalDateTime.now());
            opp.setWinNotes(request.getWinNotes());
            opp.setProbabilityPct(100);
            opp.setWeightedValue(opp.getDealValue());
        } else if (request.getStatus() == OpportunityDealStatus.LOST) {
            opp.setLostAt(LocalDateTime.now());
            opp.setLostReasonId(request.getLostReasonId());
            opp.setLostNotes(request.getLostNotes());
            opp.setProbabilityPct(0);
            opp.setWeightedValue(BigDecimal.ZERO);
        }

        CrmOpportunity savedOpp = opportunityRepository.save(opp);

        // Trigger automation evaluation for OPPORTUNITY_STAGE_CHANGED
        if (automationEvaluatorService != null) {
            try {
                automationEvaluatorService.evaluateAndExecute(companyId,
                        com.erp.crm.modules.automation.enums.AutomationTrigger.OPPORTUNITY_STAGE_CHANGED,
                        savedOpp, savedOpp.getId(), "OPPORTUNITY");
            } catch (Exception e) {
                log.warn("Automation execution failed on opportunity stage change [{}]: {}", savedOpp.getId(), e.getMessage());
            }
        }

        return enrichResponse(savedOpp);
    }

    private String generateOpportunityCode() {
        return "OPP-" + LocalDate.now().getYear() + "-" + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999));
    }

    private OpportunityResponse enrichResponse(CrmOpportunity opp) {
        String pName = pipelineRepository.findByCompanyIdAndIdAndIsDeletedFalse(opp.getCompanyId(), opp.getPipelineId())
                .map(p -> p.getPipelineName()).orElse("");
        String sName = stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(opp.getPipelineId())
                .stream().filter(s -> s.getId().equals(opp.getCurrentStageId())).findFirst()
                .map(s -> s.getStageName()).orElse("");
        String accName = opp.getAccountId() != null
                ? accountRepository.findByCompanyIdAndIdAndIsDeletedFalse(opp.getCompanyId(), opp.getAccountId()).map(a -> a.getAccountName()).orElse("")
                : "";
        String conName = opp.getPrimaryContactId() != null
                ? contactRepository.findByCompanyIdAndIdAndIsDeletedFalse(opp.getCompanyId(), opp.getPrimaryContactId()).map(c -> c.getDisplayName()).orElse("")
                : "";

        List<CrmOpportunityItem> items = itemRepository.findByCompanyIdAndOpportunityIdAndIsDeletedFalse(
                opp.getCompanyId(), opp.getId());

        List<OpportunityResponse.ItemResponse> itemResponses = items.stream().map(i -> OpportunityResponse.ItemResponse.builder()
                .id(i.getId())
                .productId(i.getProductId())
                .productCode(i.getProductCode())
                .productName(i.getProductName())
                .quantity(i.getQuantity())
                .uom(i.getUom())
                .unitPrice(i.getUnitPrice())
                .totalAmount(i.getTotalAmount())
                .build()).toList();

        return OpportunityResponse.builder()
                .id(opp.getId())
                .companyId(opp.getCompanyId())
                .opportunityCode(opp.getOpportunityCode())
                .opportunityName(opp.getOpportunityName())
                .pipelineId(opp.getPipelineId())
                .pipelineName(pName)
                .currentStageId(opp.getCurrentStageId())
                .currentStageName(sName)
                .accountId(opp.getAccountId())
                .accountName(accName)
                .primaryContactId(opp.getPrimaryContactId())
                .contactName(conName)
                .originLeadId(opp.getOriginLeadId())
                .dealValue(opp.getDealValue())
                .currency(opp.getCurrency())
                .expectedCloseDate(opp.getExpectedCloseDate())
                .probabilityPct(opp.getProbabilityPct())
                .weightedValue(opp.getWeightedValue())
                .ownerUserId(opp.getOwnerUserId())
                .dealType(opp.getDealType())
                .dealStatus(opp.getDealStatus())
                .wonAt(opp.getWonAt())
                .lostAt(opp.getLostAt())
                .items(itemResponses)
                .createdAt(opp.getCreatedAt())
                .updatedAt(opp.getUpdatedAt())
                .build();
    }
}
