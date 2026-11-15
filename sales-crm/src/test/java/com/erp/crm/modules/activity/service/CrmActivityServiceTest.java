package com.erp.crm.modules.activity.service;

import com.erp.crm.modules.activity.dto.request.ActivityRequest;
import com.erp.crm.modules.activity.dto.response.ActivityResponse;
import com.erp.crm.modules.activity.entity.CrmActivity;
import com.erp.crm.modules.activity.repository.CrmActivityRepository;
import com.erp.crm.modules.activity.service.serviceImpl.CrmActivityServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmActivityServiceTest {

    @Mock
    private CrmActivityRepository activityRepository;

    @InjectMocks
    private CrmActivityServiceImpl activityService;

    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
        com.erp.crm.common.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.crm.common.security.CurrentUserContext.setUserId(userId);
    }

    @AfterEach
    void tearDown() {
        com.erp.crm.common.security.CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Log Activity successfully maps and persists CrmActivity")
    void testLogActivity() {
        UUID entityId = UUID.randomUUID();
        ActivityRequest request = ActivityRequest.builder()
                .entityType("LEAD")
                .entityId(entityId)
                .activityType("CALL")
                .subject("Follow up phone call")
                .description("Client showed interest in demo")
                .activityAt(LocalDateTime.now())
                .build();

        CrmActivity saved = CrmActivity.builder()
                .id(UUID.randomUUID())
                .entityType("LEAD")
                .entityId(entityId)
                .activityType("CALL")
                .subject("Follow up phone call")
                .description("Client showed interest in demo")
                .activityAt(LocalDateTime.now())
                .performedByUserId(userId)
                .build();
        saved.setCompanyId(companyId);

        when(activityRepository.save(any(CrmActivity.class))).thenReturn(saved);

        ActivityResponse response = activityService.logActivity(request, companyId);

        assertNotNull(response);
        assertEquals("LEAD", response.getEntityType());
        assertEquals("CALL", response.getActivityType());
        assertEquals("Follow up phone call", response.getSubject());
        verify(activityRepository, times(1)).save(any(CrmActivity.class));
    }

    @Test
    @DisplayName("Get Activities with companyId only returns all company activities")
    void testGetActivitiesCompanyOnly() {
        CrmActivity act1 = CrmActivity.builder()
                .id(UUID.randomUUID())
                .entityType("LEAD")
                .entityId(UUID.randomUUID())
                .activityType("CALL")
                .subject("Intro Call")
                .activityAt(LocalDateTime.now())
                .performedByUserId(userId)
                .build();
        act1.setCompanyId(companyId);

        when(activityRepository.findByCompanyIdAndIsDeletedFalseOrderByActivityAtDesc(eq(companyId)))
                .thenReturn(List.of(act1));

        List<ActivityResponse> list = activityService.getActivities(null, null, null, companyId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Intro Call", list.get(0).getSubject());
        verify(activityRepository, times(1)).findByCompanyIdAndIsDeletedFalseOrderByActivityAtDesc(eq(companyId));
    }

    @Test
    @DisplayName("Get Activities with activityType filter returns filtered list")
    void testGetActivitiesByType() {
        CrmActivity act1 = CrmActivity.builder()
                .id(UUID.randomUUID())
                .entityType("LEAD")
                .entityId(UUID.randomUUID())
                .activityType("MEETING")
                .subject("Sales Demo")
                .activityAt(LocalDateTime.now())
                .performedByUserId(userId)
                .build();
        act1.setCompanyId(companyId);

        when(activityRepository.findByCompanyIdAndActivityTypeAndIsDeletedFalseOrderByActivityAtDesc(eq(companyId), eq("MEETING")))
                .thenReturn(List.of(act1));

        List<ActivityResponse> list = activityService.getActivities(null, null, "MEETING", companyId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("MEETING", list.get(0).getActivityType());
        verify(activityRepository, times(1)).findByCompanyIdAndActivityTypeAndIsDeletedFalseOrderByActivityAtDesc(eq(companyId), eq("MEETING"));
    }

    @Test
    @DisplayName("Get Activities with entityType and entityId returns entity timeline")
    void testGetTimelineForEntity() {
        UUID leadId = UUID.randomUUID();
        CrmActivity act1 = CrmActivity.builder()
                .id(UUID.randomUUID())
                .entityType("LEAD")
                .entityId(leadId)
                .activityType("EMAIL")
                .subject("Proposal sent")
                .activityAt(LocalDateTime.now())
                .performedByUserId(userId)
                .build();
        act1.setCompanyId(companyId);

        when(activityRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByActivityAtDesc(eq(companyId), eq("LEAD"), eq(leadId)))
                .thenReturn(List.of(act1));

        List<ActivityResponse> list = activityService.getTimeline("LEAD", leadId, companyId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Proposal sent", list.get(0).getSubject());
        verify(activityRepository, times(1)).findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByActivityAtDesc(eq(companyId), eq("LEAD"), eq(leadId));
    }
}
