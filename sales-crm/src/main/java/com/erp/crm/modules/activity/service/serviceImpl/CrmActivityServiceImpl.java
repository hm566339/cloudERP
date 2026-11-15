package com.erp.crm.modules.activity.service.serviceImpl;

import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.activity.dto.request.ActivityRequest;
import com.erp.crm.modules.activity.dto.response.ActivityResponse;
import com.erp.crm.modules.activity.entity.CrmActivity;
import com.erp.crm.modules.activity.repository.CrmActivityRepository;
import com.erp.crm.modules.activity.service.CrmActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmActivityServiceImpl implements CrmActivityService {

    private final CrmActivityRepository activityRepository;

    @Override
    public ActivityResponse logActivity(ActivityRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Logging CRM Activity: {} for {}/{}", request.getActivityType(), request.getEntityType(), request.getEntityId());

        CrmActivity activity = CrmActivity.builder()
                .entityType(request.getEntityType().toUpperCase())
                .entityId(request.getEntityId())
                .activityType(request.getActivityType().toUpperCase())
                .subject(request.getSubject())
                .description(request.getDescription())
                .activityAt(request.getActivityAt() != null ? request.getActivityAt() : LocalDateTime.now())
                .performedByUserId(TenantUtils.getCurrentUserId())
                .build();
        activity.setCompanyId(companyId);

        CrmActivity saved = activityRepository.save(activity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getTimeline(String entityType, UUID entityId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return activityRepository.findByCompanyIdAndEntityTypeAndEntityIdAndIsDeletedFalseOrderByActivityAtDesc(
                companyId, entityType.toUpperCase(), entityId)
                .stream().map(this::mapToResponse).toList();
    }

    private ActivityResponse mapToResponse(CrmActivity a) {
        return ActivityResponse.builder()
                .id(a.getId())
                .companyId(a.getCompanyId())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .activityType(a.getActivityType())
                .subject(a.getSubject())
                .description(a.getDescription())
                .activityAt(a.getActivityAt())
                .performedByUserId(a.getPerformedByUserId())
                .createdAt(a.getCreatedAt())
                .build();
    }
}

