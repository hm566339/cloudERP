package com.erp.communication.service;

import com.erp.communication.dto.response.NotificationStatusResponse;
import com.erp.communication.entity.NotificationDelivery;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.exception.InvalidRequestException;
import com.erp.communication.repository.NotificationDeliveryRepository;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationQueryService {

    private final NotificationRequestRepository requestRepository;
    private final NotificationDeliveryRepository deliveryRepository;

    @Transactional(readOnly = true)
    public NotificationStatusResponse getNotificationStatus(UUID notificationId, UUID headerCompanyId) {
        if (notificationId == null) {
            throw new InvalidRequestException("notificationId is required");
        }

        NotificationRequest request = requestRepository.findById(notificationId)
                .orElseThrow(() -> new InvalidRequestException("Notification record not found for id: " + notificationId));

        // Enforce Tenant Isolation
        UUID expectedCompanyId = headerCompanyId != null ? headerCompanyId : TenantContext.getCompanyId();
        if (expectedCompanyId != null && !expectedCompanyId.equals(request.getCompanyId())) {
            log.warn("Cross-tenant access attempted | notificationId={} | requestCompany={} | callerCompany={}",
                    notificationId, request.getCompanyId(), expectedCompanyId);
            throw new AccessDeniedException("Access denied: You do not have permission to view notifications for this company");
        }

        List<NotificationDelivery> deliveries = deliveryRepository.findByNotificationRequestIdOrderByAttemptNumberAsc(notificationId);

        List<NotificationStatusResponse.DeliveryAttemptResponse> attemptResponses = deliveries.stream()
                .map(d -> NotificationStatusResponse.DeliveryAttemptResponse.builder()
                        .deliveryId(d.getId())
                        .providerName(d.getProviderName())
                        .attemptNumber(d.getAttemptNumber())
                        .status(d.getStatus())
                        .providerMessageId(d.getProviderMessageId())
                        .attemptAt(d.getAttemptAt())
                        .durationMs(d.getDurationMs())
                        .errorDetails(d.getErrorDetails())
                        .build())
                .collect(Collectors.toList());

        return NotificationStatusResponse.builder()
                .notificationId(request.getId())
                .companyId(request.getCompanyId())
                .channel(request.getChannel())
                .recipientMasked(request.getRecipientMasked())
                .eventCode(request.getEventCode())
                .status(request.getStatus())
                .retryCount(request.getRetryCount())
                .maxRetries(request.getMaxRetries())
                .errorSummary(request.getErrorSummary())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .deliveryAttempts(attemptResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<NotificationStatusResponse> getCompanyNotifications(UUID companyId, Pageable pageable) {
        if (companyId == null) {
            throw new InvalidRequestException("companyId is required");
        }

        UUID callerCompany = TenantContext.getCompanyId();
        if (callerCompany != null && !callerCompany.equals(companyId)) {
            throw new AccessDeniedException("Access denied: Cross-tenant query forbidden");
        }

        return requestRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable)
                .map(nr -> NotificationStatusResponse.builder()
                        .notificationId(nr.getId())
                        .companyId(nr.getCompanyId())
                        .channel(nr.getChannel())
                        .recipientMasked(nr.getRecipientMasked())
                        .eventCode(nr.getEventCode())
                        .status(nr.getStatus())
                        .retryCount(nr.getRetryCount())
                        .maxRetries(nr.getMaxRetries())
                        .errorSummary(nr.getErrorSummary())
                        .createdAt(nr.getCreatedAt())
                        .updatedAt(nr.getUpdatedAt())
                        .build());
    }
}
