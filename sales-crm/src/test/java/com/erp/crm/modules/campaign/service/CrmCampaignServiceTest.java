package com.erp.crm.modules.campaign.service;

import com.erp.crm.common.exception.ConflictException;
import com.erp.crm.modules.campaign.dto.CampaignAttributionResponse;
import com.erp.crm.modules.campaign.dto.CampaignPerformanceResponse;
import com.erp.crm.modules.campaign.dto.CampaignRequest;
import com.erp.crm.modules.campaign.dto.CampaignResponse;
import com.erp.crm.modules.campaign.entity.CrmCampaign;
import com.erp.crm.modules.campaign.entity.CrmLeadAttribution;
import com.erp.crm.modules.campaign.repository.CrmCampaignRepository;
import com.erp.crm.modules.campaign.repository.CrmLeadAttributionRepository;
import com.erp.crm.modules.campaign.service.serviceImpl.CrmCampaignServiceImpl;
import com.erp.crm.modules.communication.enums.CommunicationChannel;
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
class CrmCampaignServiceTest {

    @Mock
    private CrmCampaignRepository campaignRepository;

    @Mock
    private CrmLeadAttributionRepository attributionRepository;

    @Mock
    private CrmAttributionService attributionService;

    @InjectMocks
    private CrmCampaignServiceImpl campaignService;

    private UUID companyId;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        com.erp.crm.common.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.crm.common.security.CurrentUserContext.setUserId(UUID.randomUUID());
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.erp.crm.common.security.CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Should create campaign successfully and enforce unique campaign code per company")
    void testCreateCampaignSuccess() {
        CampaignRequest request = CampaignRequest.builder()
                .campaignCode("EXPO_2026")
                .campaignName("Engineering Expo 2026")
                .channel(CommunicationChannel.EMAIL)
                .startDate(LocalDate.now())
                .allocatedBudget(new BigDecimal("100000.00"))
                .build();

        when(campaignRepository.findByCompanyIdAndCampaignCodeAndIsDeletedFalse(companyId, "EXPO_2026"))
                .thenReturn(Optional.empty());
        when(campaignRepository.save(any(CrmCampaign.class))).thenAnswer(i -> {
            CrmCampaign c = i.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CampaignResponse response = campaignService.createCampaign(request, companyId);

        assertNotNull(response);
        assertEquals("EXPO_2026", response.getCampaignCode());
        assertEquals(companyId, response.getCompanyId());
    }

    @Test
    @DisplayName("Should throw ConflictException on duplicate campaign code")
    void testDuplicateCampaignCode() {
        CampaignRequest request = CampaignRequest.builder()
                .campaignCode("DUPLICATE_CODE")
                .campaignName("Test")
                .startDate(LocalDate.now())
                .build();

        when(campaignRepository.findByCompanyIdAndCampaignCodeAndIsDeletedFalse(companyId, "DUPLICATE_CODE"))
                .thenReturn(Optional.of(new CrmCampaign()));

        assertThrows(ConflictException.class, () -> campaignService.createCampaign(request, companyId));
    }

    @Test
    @DisplayName("Should calculate ROI, CPL, CPA and Conversion Rate accurately")
    void testCampaignPerformanceCalculation() {
        UUID campaignId = UUID.randomUUID();

        // Spend: 50,000 | Revenue: 200,000 | Leads: 25 | Conversions: 5
        // Profit: 150,000 | ROI: (150,000 / 50,000) * 100 = 300%
        // CPL: 50,000 / 25 = 2,000 | CPA: 50,000 / 5 = 10,000 | ConvRate: (5 / 25) * 100 = 20%
        CrmCampaign campaign = CrmCampaign.builder()
                .id(campaignId)
                .campaignCode("GOOGLE_ADS_Q4")
                .campaignName("Google Search Ads")
                .allocatedBudget(new BigDecimal("100000.0000"))
                .actualSpend(new BigDecimal("50000.0000"))
                .actualRevenueWon(new BigDecimal("200000.0000"))
                .actualLeadsCount(25)
                .actualConversionsCount(5)
                .build();
        campaign.setCompanyId(companyId);

        when(campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, campaignId))
                .thenReturn(Optional.of(campaign));

        CampaignPerformanceResponse perf = campaignService.getCampaignPerformance(campaignId, companyId);

        assertNotNull(perf);
        assertEquals(0, new BigDecimal("150000.0000").compareTo(perf.getNetProfit()));
        assertEquals(0, new BigDecimal("300.0000").compareTo(perf.getRoiPercentage()));
        assertEquals(0, new BigDecimal("2000.0000").compareTo(perf.getCostPerLead()));
        assertEquals(0, new BigDecimal("10000.0000").compareTo(perf.getCostPerAcquisition()));
        assertEquals(0, new BigDecimal("20.0000").compareTo(perf.getConversionRatePercentage()));
    }

    @Test
    @DisplayName("Should prevent division by zero when campaign spend and leads are zero")
    void testPerformanceZeroDivisionsSafe() {
        UUID campaignId = UUID.randomUUID();

        CrmCampaign campaign = CrmCampaign.builder()
                .id(campaignId)
                .campaignCode("NEW_CAMPAIGN")
                .actualSpend(BigDecimal.ZERO)
                .actualRevenueWon(BigDecimal.ZERO)
                .actualLeadsCount(0)
                .actualConversionsCount(0)
                .build();
        campaign.setCompanyId(companyId);

        when(campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, campaignId))
                .thenReturn(Optional.of(campaign));

        CampaignPerformanceResponse perf = campaignService.getCampaignPerformance(campaignId, companyId);

        assertNotNull(perf);
        assertEquals(BigDecimal.ZERO, perf.getRoiPercentage());
        assertEquals(BigDecimal.ZERO, perf.getCostPerLead());
        assertEquals(BigDecimal.ZERO, perf.getCostPerAcquisition());
        assertEquals(BigDecimal.ZERO, perf.getConversionRatePercentage());
    }
}
