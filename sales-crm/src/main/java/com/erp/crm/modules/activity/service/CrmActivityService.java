package com.erp.crm.modules.activity.service;

import com.erp.crm.modules.activity.dto.request.ActivityRequest;
import com.erp.crm.modules.activity.dto.response.ActivityResponse;

import java.util.List;
import java.util.UUID;

public interface CrmActivityService {

    ActivityResponse logActivity(ActivityRequest request, UUID requestCompanyId);

    List<ActivityResponse> getTimeline(String entityType, UUID entityId, UUID requestCompanyId);

    List<ActivityResponse> getActivities(String entityType, UUID entityId, String activityType, UUID requestCompanyId);
}

