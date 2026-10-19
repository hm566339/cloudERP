package com.erp.manufacturing.security.dto.sso;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoleResponse {

    private UUID id;
    private String name;
    private boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
