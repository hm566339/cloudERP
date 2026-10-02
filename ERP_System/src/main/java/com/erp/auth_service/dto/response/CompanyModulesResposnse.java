package com.erp.auth_service.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyModulesResposnse {

    private UUID id;

    private UUID moduleId;

    private String host;

    private String name;

    private boolean status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
