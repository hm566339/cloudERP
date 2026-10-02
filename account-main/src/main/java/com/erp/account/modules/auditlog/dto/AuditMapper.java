package com.erp.account.modules.auditlog.dto;

import com.erp.account.modules.common.entity.BaseEntity;

import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;
import org.springframework.stereotype.Component;
import com.erp.account.modules.common.dto.BaseResponseDto;

@Component
public class AuditMapper {

    @AfterMapping
    public static void attachAudit(BaseEntity entity, @MappingTarget BaseResponseDto dto) {
        if (entity != null && dto != null) {
            dto.setAudit(toDto(entity));
        }
    }

    public static AuditResponseDto toDto(BaseEntity entity) {
        if (entity == null) {
            return null;
        }

        AuditResponseDto dto = new AuditResponseDto();

        if (entity.getCreatedAt() != null || entity.getCreatedBy() != null || entity.getCreatedByUsername() != null) {
            String createdUsername = entity.getCreatedByUsername();
            if ((createdUsername == null || createdUsername.isBlank())
                    && entity.getCreatedBy() != null
                    && entity.getCreatedBy().equals(com.erp.account.security.CurrentUserContext.getUserId())) {
                createdUsername = com.erp.account.security.CurrentUserContext.getUsername();
            }

            dto.setCreated(AuditResponseDto.UserAction.builder()
                    .at(entity.getCreatedAt())
                    .by(AuditResponseDto.UserInfo.builder()
                            .id(entity.getCreatedBy())
                            .username(createdUsername)
                            .build())
                    .build());
        }

        if (entity.getUpdatedAt() != null || entity.getUpdatedBy() != null || entity.getUpdatedByUsername() != null) {
            String updatedUsername = entity.getUpdatedByUsername();
            if ((updatedUsername == null || updatedUsername.isBlank())
                    && entity.getUpdatedBy() != null
                    && entity.getUpdatedBy().equals(com.erp.account.security.CurrentUserContext.getUserId())) {
                updatedUsername = com.erp.account.security.CurrentUserContext.getUsername();
            }

            dto.setUpdated(AuditResponseDto.UserAction.builder()
                    .at(entity.getUpdatedAt())
                    .by(AuditResponseDto.UserInfo.builder()
                            .id(entity.getUpdatedBy())
                            .username(updatedUsername)
                            .build())
                    .build());
        }

        if (Boolean.TRUE.equals(entity.getIsDeleted()) && (entity.getDeletedAt() != null || entity.getDeletedBy() != null || entity.getDeletedByUsername() != null)) {
            dto.setDeleted(AuditResponseDto.UserAction.builder()
                    .at(entity.getDeletedAt())
                    .by(AuditResponseDto.UserInfo.builder()
                            .id(entity.getDeletedBy())
                            .username(entity.getDeletedByUsername())
                            .build())
                    .build());
        }

        if (dto.getCreated() == null && dto.getUpdated() == null && dto.getDeleted() == null) {
            return null;
        }

        return dto;
    }
}
