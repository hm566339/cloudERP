package com.erp.crm.modules.activity.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.activity.dto.response.ActivityResponse;
import com.erp.crm.modules.activity.service.CrmActivityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmActivityControllerTest {

    @Mock
    private CrmActivityService activityService;

    @InjectMocks
    private CrmActivityController activityController;

    @Test
    @DisplayName("GET /api/crm/activities with companyId only succeeds without required entityType")
    void testGetActivitiesCompanyIdOnly() {
        UUID companyId = UUID.randomUUID();
        ActivityResponse act = ActivityResponse.builder()
                .id(UUID.randomUUID())
                .entityType("LEAD")
                .entityId(UUID.randomUUID())
                .activityType("CALL")
                .subject("Call client")
                .build();

        when(activityService.getActivities(null, null, null, companyId))
                .thenReturn(List.of(act));

        ResponseEntity<ApiResponse<List<ActivityResponse>>> response = activityController.getActivities(
                null, null, null, companyId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        verify(activityService, times(1)).getActivities(null, null, null, companyId);
    }
}
