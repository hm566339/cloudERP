package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureResponse {

    private UUID id;
    private String code;
    private String name;
    private String description;
    private String moduleName;
    private boolean active;
    private List<String> actions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
