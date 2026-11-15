package com.erp.crm.modules.lead.service.serviceImpl;

import com.erp.crm.common.exception.ConflictException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.account.entity.CrmAccount;
import com.erp.crm.modules.account.entity.CrmContact;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.lead.dto.request.LeadConvertRequest;
import com.erp.crm.modules.lead.dto.request.LeadCreateRequest;
import com.erp.crm.modules.lead.dto.response.LeadConvertResponse;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.enums.LeadRating;
import com.erp.crm.modules.lead.mapper.LeadMapper;
import com.erp.crm.modules.lead.repository.*;
import com.erp.crm.modules.pipeline.repository.CrmOpportunityRepository;
import com.erp.crm.modules.pipeline.repository.CrmPipelineStageRepository;
import com.erp.crm.modules.pipeline.repository.CrmSalesPipelineRepository;
import com.erp.crm.modules.setting.repository.CrmLeadSourceRepository;
import com.erp.crm.modules.setting.repository.CrmLeadStatusRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class CrmLeadServiceImplTest {

    @Mock
    private CrmLeadRepository leadRepository;
    @Mock
    private CrmLeadProductInterestRepository productInterestRepository;
    @Mock
    private CrmLeadTagMappingRepository tagMappingRepository;
    @Mock
    private CrmLeadAssignmentHistoryRepository assignmentHistoryRepository;
    @Mock
    private CrmLeadMergeHistoryRepository mergeHistoryRepository;
    @Mock
    private CrmLeadScoreLogRepository scoreLogRepository;
    @Mock
    private CrmLeadStatusRepository statusRepository;
    @Mock
    private CrmLeadSourceRepository sourceRepository;
    @Mock
    private CrmAccountRepository accountRepository;
    @Mock
    private CrmContactRepository contactRepository;
    @Mock
    private CrmOpportunityRepository opportunityRepository;
    @Mock
    private CrmSalesPipelineRepository pipelineRepository;
    @Mock
    private CrmPipelineStageRepository stageRepository;
    @Mock
    private LeadMapper leadMapper;
    @Mock
    private com.erp.crm.modules.automation.service.CrmAutomationEvaluatorService automationEvaluatorService;

    @InjectMocks
    private CrmLeadServiceImpl leadService;

    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(userId);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Should successfully create a new lead with code generation")
    void testCreateLead_Success() {
        LeadCreateRequest request = LeadCreateRequest.builder()
                .firstName("Aarav")
                .lastName("Sharma")
                .organizationName("Sharma Technologies")
                .email("aarav@example.com")
                .phone("9876543210")
                .build();

        CrmLead mappedEntity = new CrmLead();
        mappedEntity.setFirstName(request.getFirstName());
        mappedEntity.setLastName(request.getLastName());
        mappedEntity.setOrganizationName(request.getOrganizationName());
        mappedEntity.setEmail(request.getEmail());
        mappedEntity.setPhone(request.getPhone());

        when(leadRepository.findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(Optional.empty());
        when(leadMapper.toEntity(request)).thenReturn(mappedEntity);
        when(leadRepository.save(any(CrmLead.class))).thenAnswer(invocation -> {
            CrmLead saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        LeadResponse responseDto = LeadResponse.builder()
                .firstName("Aarav")
                .lastName("Sharma")
                .displayName("Aarav Sharma")
                .build();
        when(leadMapper.toResponse(any(CrmLead.class))).thenReturn(responseDto);

        LeadResponse response = leadService.createLead(request, companyId);

        assertNotNull(response);
        assertEquals("Aarav", response.getFirstName());
        verify(leadRepository, times(1)).save(any(CrmLead.class));
        verify(automationEvaluatorService, times(1)).evaluateAndExecute(
                eq(companyId), eq(com.erp.crm.modules.automation.enums.AutomationTrigger.LEAD_CREATED), any(), any(), eq("LEAD"));
    }

    @Test
    @DisplayName("Should execute automation trigger on lead status update")
    void testUpdateLeadStatus_TriggersAutomation() {
        UUID leadId = UUID.randomUUID();
        UUID statusId = UUID.randomUUID();
        CrmLead lead = CrmLead.builder()
                .id(leadId)
                .firstName("Karan")
                .scoreGrade(LeadRating.HOT)
                .build();
        lead.setCompanyId(companyId);

        when(leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, leadId)).thenReturn(Optional.of(lead));
        com.erp.crm.modules.setting.entity.CrmLeadStatus statusEntity = com.erp.crm.modules.setting.entity.CrmLeadStatus.builder()
                .id(statusId)
                .statusCode("QUALIFIED")
                .statusName("Qualified")
                .build();
        when(statusRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, statusId)).thenReturn(Optional.of(statusEntity));
        when(leadRepository.save(any(CrmLead.class))).thenAnswer(i -> i.getArgument(0));
        when(leadMapper.toResponse(any(CrmLead.class))).thenReturn(new LeadResponse());

        com.erp.crm.modules.lead.dto.request.LeadStatusUpdateRequest statusReq = com.erp.crm.modules.lead.dto.request.LeadStatusUpdateRequest.builder()
                .statusId(statusId)
                .notes("Verified contact")
                .build();

        leadService.updateLeadStatus(leadId, statusReq, companyId);

        verify(automationEvaluatorService, times(1)).evaluateAndExecute(
                eq(companyId), eq(com.erp.crm.modules.automation.enums.AutomationTrigger.LEAD_STATUS_CHANGED), any(), eq(leadId), eq("LEAD"));
    }

    @Test
    @DisplayName("Should throw ConflictException when attempting to convert an already-converted lead")
    void testConvertLead_AlreadyConverted_Conflict() {
        UUID leadId = UUID.randomUUID();
        CrmLead lead = CrmLead.builder()
                .id(leadId)
                .firstName("Vikram")
                .isConverted(true)
                .build();
        lead.setCompanyId(companyId);

        when(leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, leadId)).thenReturn(Optional.of(lead));

        LeadConvertRequest convertReq = LeadConvertRequest.builder().build();

        assertThrows(ConflictException.class, () -> leadService.convertLead(leadId, convertReq, companyId));
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should convert qualified lead into Account, Contact, and Opportunity")
    void testConvertLead_Success() {
        UUID leadId = UUID.randomUUID();
        CrmLead lead = CrmLead.builder()
                .id(leadId)
                .firstName("Vikram")
                .lastName("Mehta")
                .displayName("Vikram Mehta")
                .organizationName("Mehta Enterprises")
                .email("vikram@mehta.com")
                .phone("+919876543210")
                .isConverted(false)
                .build();
        lead.setCompanyId(companyId);

        when(leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, leadId)).thenReturn(Optional.of(lead));

        CrmAccount account = CrmAccount.builder()
                .id(UUID.randomUUID())
                .accountName("Mehta Enterprises")
                .accountCode("ACC-101")
                .build();
        account.setCompanyId(companyId);
        when(accountRepository.save(any(CrmAccount.class))).thenReturn(account);

        CrmContact contact = CrmContact.builder()
                .id(UUID.randomUUID())
                .firstName("Vikram")
                .lastName("Mehta")
                .build();
        contact.setCompanyId(companyId);
        when(contactRepository.save(any(CrmContact.class))).thenReturn(contact);

        LeadConvertRequest convertReq = LeadConvertRequest.builder()
                .createOpportunity(false)
                .build();

        LeadConvertResponse result = leadService.convertLead(leadId, convertReq, companyId);

        assertNotNull(result);
        assertEquals(leadId, result.getLeadId());
        assertEquals(account.getId(), result.getAccountId());
        assertEquals(contact.getId(), result.getContactId());
        assertTrue(lead.getIsConverted());
        verify(leadRepository, times(1)).save(lead);
    }

    @Test
    @DisplayName("Should sanitize sort property 'date' to 'createdAt'")
    void testGetAllLeads_DateSortSanitized() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "date"));
        org.springframework.data.domain.Page<CrmLead> mockPage = new org.springframework.data.domain.PageImpl<>(java.util.Collections.emptyList());

        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor = org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        when(leadRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), pageableCaptor.capture())).thenReturn(mockPage);

        leadService.getAllLeads(null, companyId, pageable);

        org.springframework.data.domain.Pageable captured = pageableCaptor.getValue();
        assertNotNull(captured);
        org.springframework.data.domain.Sort.Order order = captured.getSort().getOrderFor("createdAt");
        assertNotNull(order, "Expected sort by createdAt when 'date' is supplied");
        assertEquals(org.springframework.data.domain.Sort.Direction.DESC, order.getDirection());
    }

    @Test
    @DisplayName("Should sanitize invalid sort property to default 'createdAt' DESC")
    void testGetAllLeads_InvalidSortSanitized() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "unknownField"));
        org.springframework.data.domain.Page<CrmLead> mockPage = new org.springframework.data.domain.PageImpl<>(java.util.Collections.emptyList());

        org.mockito.ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor = org.mockito.ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        when(leadRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), pageableCaptor.capture())).thenReturn(mockPage);

        leadService.getAllLeads(null, companyId, pageable);

        org.springframework.data.domain.Pageable captured = pageableCaptor.getValue();
        assertNotNull(captured);
        org.springframework.data.domain.Sort.Order order = captured.getSort().getOrderFor("createdAt");
        assertNotNull(order, "Expected sort to fall back safely to createdAt");
    }
}
