package com.erp.crm.modules.dashboard.service.serviceImpl;

import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.dashboard.dto.CrmDashboardSummaryResponse;
import com.erp.crm.modules.dashboard.service.CrmDashboardService;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.repository.CrmOpportunityRepository;
import com.erp.crm.modules.quotation.enums.QuotationStatus;
import com.erp.crm.modules.quotation.repository.CrmQuotationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CrmDashboardServiceImpl implements CrmDashboardService {

    private final CrmLeadRepository leadRepository;
    private final CrmOpportunityRepository opportunityRepository;
    private final CrmQuotationRepository quotationRepository;

    @Override
    public CrmDashboardSummaryResponse getDashboardSummary(UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);

        long totalLeads = leadRepository.countActiveLeads(companyId);
        long convertedLeads = leadRepository.countConvertedLeads(companyId);
        long lostLeads = leadRepository.countLostLeads(companyId);
        double convRate = totalLeads > 0 ? ((double) convertedLeads / totalLeads) * 100.0 : 0.0;

        long openDeals = opportunityRepository.countByCompanyIdAndDealStatus(companyId, OpportunityDealStatus.OPEN);
        long wonDeals = opportunityRepository.countByCompanyIdAndDealStatus(companyId, OpportunityDealStatus.WON);
        long lostDeals = opportunityRepository.countByCompanyIdAndDealStatus(companyId, OpportunityDealStatus.LOST);
        BigDecimal pipelineVal = opportunityRepository.sumDealValueByStatus(companyId, OpportunityDealStatus.OPEN);
        BigDecimal wonRev = opportunityRepository.sumDealValueByStatus(companyId, OpportunityDealStatus.WON);

        long draftQuotes = quotationRepository.countByCompanyIdAndStatus(companyId, QuotationStatus.DRAFT);
        long pendingQuotes = quotationRepository.countByCompanyIdAndStatus(companyId, QuotationStatus.PENDING_APPROVAL);
        long convertedQuotes = quotationRepository.countByCompanyIdAndStatus(companyId, QuotationStatus.CONVERTED_TO_ORDER);
        BigDecimal convertedQuotesVal = quotationRepository.sumTotalAmountByStatus(companyId, QuotationStatus.CONVERTED_TO_ORDER);

        return CrmDashboardSummaryResponse.builder()
                .totalLeads(totalLeads)
                .convertedLeads(convertedLeads)
                .lostLeads(lostLeads)
                .leadConversionRatePct(Math.round(convRate * 10.0) / 10.0)
                .totalOpenDeals(openDeals)
                .totalWonDeals(wonDeals)
                .totalLostDeals(lostDeals)
                .openPipelineValue(pipelineVal)
                .wonRevenue(wonRev)
                .totalDraftQuotes(draftQuotes)
                .pendingApprovalQuotes(pendingQuotes)
                .convertedQuotes(convertedQuotes)
                .convertedQuotesValue(convertedQuotesVal)
                .build();
    }
}

