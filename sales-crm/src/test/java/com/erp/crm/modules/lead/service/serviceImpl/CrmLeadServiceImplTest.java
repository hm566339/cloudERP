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
    @DisplayName("Should throw ConflictException when attempting to convert an already-converted lead with active account")
    void testConvertLead_AlreadyConverted_Conflict() {
        UUID leadId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        CrmLead lead = CrmLead.builder()
                .id(leadId)
                .firstName("Vikram")
                .isConverted(true)
                .convertedAccountId(accountId)
                .build();
        lead.setCompanyId(companyId);

        when(leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, leadId)).thenReturn(Optional.of(lead));
        when(accountRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, accountId))
                .thenReturn(Optional.of(CrmAccount.builder().id(accountId).build()));

        LeadConvertRequest convertReq = LeadConvertRequest.builder().build();

        ConflictException ex = assertThrows(ConflictException.class, () -> leadService.convertLead(leadId, convertReq, companyId));
        assertEquals("Lead has already been converted.", ex.getMessage());
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow reconversion when previously converted records are missing or soft-deleted")
    void testConvertLead_AlreadyConverted_AllowsReconversionWhenRecordsDeletedOrMissing() {
        UUID leadId = UUID.randomUUID();
        UUID staleAccountId = UUID.randomUUID();
        UUID staleContactId = UUID.randomUUID();
        UUID staleOppId = UUID.randomUUID();

        CrmLead lead = CrmLead.builder()
                .id(leadId)
                .firstName("Vikram")
                .lastName("Mehta")
                .displayName("Vikram Mehta")
                .organizationName("Mehta Enterprises")
                .email("vikram@mehta.com")
                .phone("+919876543210")
                .isConverted(true)
                .convertedAccountId(staleAccountId)
                .convertedContactId(staleContactId)
                .convertedOpportunityId(staleOppId)
                .convertedAt(java.time.LocalDateTime.now().minusDays(10))
                .convertedByUserId(UUID.randomUUID())
                .build();
        lead.setCompanyId(companyId);

        when(leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, leadId)).thenReturn(Optional.of(lead));
        when(accountRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, staleAccountId)).thenReturn(Optional.empty());
        when(contactRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, staleContactId)).thenReturn(Optional.empty());
        when(opportunityRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, staleOppId)).thenReturn(Optional.empty());

        UUID newAccountId = UUID.randomUUID();
        CrmAccount newAccount = CrmAccount.builder()
                .id(newAccountId)
                .accountName("Mehta Enterprises")
                .accountCode("ACC-NEW")
                .build();
        newAccount.setCompanyId(companyId);
        when(accountRepository.save(any(CrmAccount.class))).thenReturn(newAccount);

        UUID newContactId = UUID.randomUUID();
        CrmContact newContact = CrmContact.builder()
                .id(newContactId)
                .firstName("Vikram")
                .lastName("Mehta")
                .build();
        newContact.setCompanyId(companyId);
        when(contactRepository.save(any(CrmContact.class))).thenReturn(newContact);

        LeadConvertRequest convertReq = LeadConvertRequest.builder()
                .createOpportunity(false)
                .build();

        LeadConvertResponse result = leadService.convertLead(leadId, convertReq, companyId);

        assertNotNull(result);
        assertEquals(leadId, result.getLeadId());
        assertEquals(newAccountId, result.getAccountId());
        assertEquals(newContactId, result.getContactId());
        assertTrue(lead.getIsConverted());
        assertEquals(newAccountId, lead.getConvertedAccountId());
        assertEquals(newContactId, lead.getConvertedContactId());
        assertNull(lead.getConvertedOpportunityId());
        assertNotNull(lead.getConvertedAt());
        verify(leadRepository, times(1)).save(lead);
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

    @Test
    @DisplayName("Should defensively sanitize and truncate oversized field values on lead creation")
    void testCreateLead_SanitizesOversizedFields() {
        String longPhone = "+1 (555) 019-2834 ext. 1234567890123456789012345";
        String longAltPhone = "+91 98765 43210 (After 6 PM IST only please)";
        String longPostal = "<test lead: dummy data for postal_code>";
        String longName = "A".repeat(150);

        LeadCreateRequest request = LeadCreateRequest.builder()
                .firstName(longName)
                .lastName(longName)
                .salutation("Dr. Professor Emeritus Sir")
                .organizationName("Very Long Organization Name Inc")
                .email("test@example.com")
                .phone(longPhone)
                .alternatePhone(longAltPhone)
                .postalCode(longPostal)
                .stateCode("CALIFORNIA-WEST")
                .pan("ABCDE1234F_EXTRA")
                .gstin("22AAAAA0000A1Z5_EXTRA")
                .build();

        CrmLead mappedEntity = new CrmLead();
        mappedEntity.setFirstName(request.getFirstName());
        mappedEntity.setLastName(request.getLastName());
        mappedEntity.setSalutation(request.getSalutation());
        mappedEntity.setPhone(request.getPhone());
        mappedEntity.setAlternatePhone(request.getAlternatePhone());
        mappedEntity.setPostalCode(request.getPostalCode());
        mappedEntity.setStateCode(request.getStateCode());
        mappedEntity.setPan(request.getPan());
        mappedEntity.setGstin(request.getGstin());
        mappedEntity.setEmail(request.getEmail());

        when(leadRepository.findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(eq(companyId), anyString())).thenReturn(Optional.empty());
        when(leadMapper.toEntity(request)).thenReturn(mappedEntity);

        org.mockito.ArgumentCaptor<CrmLead> leadCaptor = org.mockito.ArgumentCaptor.forClass(CrmLead.class);
        when(leadRepository.save(leadCaptor.capture())).thenAnswer(invocation -> {
            CrmLead saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        when(leadMapper.toResponse(any(CrmLead.class))).thenReturn(LeadResponse.builder().id(UUID.randomUUID()).build());

        leadService.createLead(request, companyId);

        CrmLead captured = leadCaptor.getValue();
        assertNotNull(captured);
        assertTrue(captured.getPhone().length() <= 30, "phone should be <= 30 chars");
        assertTrue(captured.getAlternatePhone().length() <= 30, "alternatePhone should be <= 30 chars");
        assertTrue(captured.getNormalizedPhone().length() <= 20, "normalizedPhone should be <= 20 chars");
        assertTrue(captured.getPostalCode().length() <= 20, "postalCode should be <= 20 chars");
        assertTrue(captured.getFirstName().length() <= 100, "firstName should be <= 100 chars");
        assertTrue(captured.getLastName().length() <= 100, "lastName should be <= 100 chars");
        assertTrue(captured.getSalutation().length() <= 20, "salutation should be <= 20 chars");
        assertTrue(captured.getStateCode().length() <= 10, "stateCode should be <= 10 chars");
        assertTrue(captured.getPan().length() <= 10, "pan should be <= 10 chars");
        assertTrue(captured.getGstin().length() <= 15, "gstin should be <= 15 chars");
    }
}
