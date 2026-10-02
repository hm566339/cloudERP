package com.erp.auth_service.dto.platform;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMutationRequest {

    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "ResourceType is required")
    private String resourceType;

    @NotBlank(message = "ResourceId is required")
    private String resourceId;

    @NotBlank(message = "Reason is required")
    private String reason;

    private Map<String, Object> payload;
}
