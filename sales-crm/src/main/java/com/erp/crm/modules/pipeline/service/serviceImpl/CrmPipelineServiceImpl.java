package com.erp.crm.modules.pipeline.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.pipeline.dto.request.PipelineRequest;
import com.erp.crm.modules.pipeline.dto.response.PipelineResponse;
import com.erp.crm.modules.pipeline.entity.CrmPipelineStage;
import com.erp.crm.modules.pipeline.entity.CrmSalesPipeline;
import com.erp.crm.modules.pipeline.enums.PipelineStageCategory;
import com.erp.crm.modules.pipeline.repository.CrmPipelineStageRepository;
import com.erp.crm.modules.pipeline.repository.CrmSalesPipelineRepository;
import com.erp.crm.modules.pipeline.service.CrmPipelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmPipelineServiceImpl implements CrmPipelineService {

    private final CrmSalesPipelineRepository pipelineRepository;
    private final CrmPipelineStageRepository stageRepository;

    @Override
    public PipelineResponse createPipeline(PipelineRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Creating Sales Pipeline: {} for companyId: {}", request.getPipelineName(), companyId);

        CrmSalesPipeline pipeline = CrmSalesPipeline.builder()
                .pipelineCode(generatePipelineCode())
                .pipelineName(request.getPipelineName())
                .description(request.getDescription())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .isActive(true)
                .displayOrder(0)
                .build();
        pipeline.setCompanyId(companyId);
        CrmSalesPipeline savedPipeline = pipelineRepository.save(pipeline);

        if (request.getStages() != null) {
            int order = 1;
            for (PipelineRequest.StageRequest stageReq : request.getStages()) {
                CrmPipelineStage stage = CrmPipelineStage.builder()
                        .pipelineId(savedPipeline.getId())
                        .stageCode(stageReq.getStageCode() != null ? stageReq.getStageCode() : "STG_" + order)
                        .stageName(stageReq.getStageName())
                        .stageOrder(stageReq.getStageOrder() != null ? stageReq.getStageOrder() : order)
                        .stageCategory(stageReq.getStageCategory() != null ? stageReq.getStageCategory() : PipelineStageCategory.PROSPECTING)
                        .winProbabilityPct(stageReq.getWinProbabilityPct() != null ? stageReq.getWinProbabilityPct() : (order * 15))
                        .rottingDays(stageReq.getRottingDays() != null ? stageReq.getRottingDays() : 14)
                        .slaDays(stageReq.getSlaDays() != null ? stageReq.getSlaDays() : 7)
                        .colorCode(stageReq.getColorCode() != null ? stageReq.getColorCode() : "#6366F1")
                        .isActive(true)
                        .build();
                stage.setCompanyId(companyId);
                stageRepository.save(stage);
                order++;
            }
        }

        return getPipelineById(savedPipeline.getId(), companyId);
    }

    @Override
    @Transactional(readOnly = true)
    public PipelineResponse getPipelineById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmSalesPipeline pipeline = pipelineRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline not found with id: " + id));

        List<CrmPipelineStage> stages = stageRepository.findByPipelineIdAndIsDeletedFalseOrderByStageOrderAsc(pipeline.getId());

        List<PipelineResponse.StageResponse> stageResponses = stages.stream().map(s -> PipelineResponse.StageResponse.builder()
                .id(s.getId())
                .stageCode(s.getStageCode())
                .stageName(s.getStageName())
                .stageOrder(s.getStageOrder())
                .stageCategory(s.getStageCategory())
                .winProbabilityPct(s.getWinProbabilityPct())
                .rottingDays(s.getRottingDays())
                .slaDays(s.getSlaDays())
                .colorCode(s.getColorCode())
                .isActive(s.getIsActive())
                .build()).toList();

        return PipelineResponse.builder()
                .id(pipeline.getId())
                .companyId(pipeline.getCompanyId())
                .pipelineCode(pipeline.getPipelineCode())
                .pipelineName(pipeline.getPipelineName())
                .description(pipeline.getDescription())
                .isDefault(pipeline.getIsDefault())
                .isActive(pipeline.getIsActive())
                .displayOrder(pipeline.getDisplayOrder())
                .stages(stageResponses)
                .createdAt(pipeline.getCreatedAt())
                .updatedAt(pipeline.getUpdatedAt())
                .build();
    }

    @Override
    public List<PipelineResponse> getAllPipelines(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        List<CrmSalesPipeline> list = pipelineRepository.findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(companyId);
        if (list.isEmpty()) {
            seedDefaultPipeline(companyId);
            list = pipelineRepository.findByCompanyIdAndIsDeletedFalseOrderByDisplayOrderAsc(companyId);
        }
        return list.stream().map(p -> getPipelineById(p.getId(), companyId)).toList();
    }

    private void seedDefaultPipeline(UUID companyId) {
        log.info("Auto-seeding standard Sales Pipeline for company [{}]", companyId);
        try {
            CrmSalesPipeline pipeline = CrmSalesPipeline.builder()
                    .pipelineCode(generatePipelineCode())
                    .pipelineName("Standard Sales Pipeline")
                    .description("Default end-to-end sales lifecycle pipeline")
                    .isDefault(true)
                    .isActive(true)
                    .displayOrder(0)
                    .build();
            pipeline.setCompanyId(companyId);
            CrmSalesPipeline savedPipeline = pipelineRepository.save(pipeline);

            List<CrmPipelineStage> defaultStages = List.of(
                    CrmPipelineStage.builder().pipelineId(savedPipeline.getId()).stageCode("QUALIFICATION").stageName("Qualification").stageOrder(1).stageCategory(PipelineStageCategory.PROSPECTING).winProbabilityPct(10).rottingDays(14).slaDays(7).colorCode("#3B82F6").isActive(true).build(),
                    CrmPipelineStage.builder().pipelineId(savedPipeline.getId()).stageCode("NEEDS_ANALYSIS").stageName("Needs Analysis").stageOrder(2).stageCategory(PipelineStageCategory.QUALIFICATION).winProbabilityPct(25).rottingDays(14).slaDays(7).colorCode("#F59E0B").isActive(true).build(),
                    CrmPipelineStage.builder().pipelineId(savedPipeline.getId()).stageCode("PROPOSAL").stageName("Proposal / Quote").stageOrder(3).stageCategory(PipelineStageCategory.PROPOSAL).winProbabilityPct(50).rottingDays(14).slaDays(7).colorCode("#6366F1").isActive(true).build(),
                    CrmPipelineStage.builder().pipelineId(savedPipeline.getId()).stageCode("NEGOTIATION").stageName("Negotiation").stageOrder(4).stageCategory(PipelineStageCategory.NEGOTIATION).winProbabilityPct(75).rottingDays(14).slaDays(7).colorCode("#8B5CF6").isActive(true).build(),
                    CrmPipelineStage.builder().pipelineId(savedPipeline.getId()).stageCode("CLOSED_WON").stageName("Closed Won").stageOrder(5).stageCategory(PipelineStageCategory.WON).winProbabilityPct(100).rottingDays(0).slaDays(0).colorCode("#10B981").isActive(true).build(),
                    CrmPipelineStage.builder().pipelineId(savedPipeline.getId()).stageCode("CLOSED_LOST").stageName("Closed Lost").stageOrder(6).stageCategory(PipelineStageCategory.LOST).winProbabilityPct(0).rottingDays(0).slaDays(0).colorCode("#EF4444").isActive(true).build()
            );
            for (CrmPipelineStage s : defaultStages) {
                s.setCompanyId(companyId);
            }
            stageRepository.saveAll(defaultStages);
        } catch (Exception e) {
            log.warn("Could not auto-seed default pipeline: {}", e.getMessage());
        }
    }

    private String generatePipelineCode() {
        return "PL-" + LocalDate.now().getYear() + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(1, 9999));
    }
}

