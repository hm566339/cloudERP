package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RoleDetailsResponse {
    private UUID id;
    private String name;
    private boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoleUserResponse> users;
    private PaginationResponse pagination;
}