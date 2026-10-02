package com.erp.auth_service.dto.platform;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformCompanySummaryResponse {

    private UUID id;
    private String code;
    private String name;
    private boolean active;
    private List<String> modules;
    private LocalDateTime createdAt;
}
