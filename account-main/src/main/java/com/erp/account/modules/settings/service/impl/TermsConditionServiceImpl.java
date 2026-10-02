package com.erp.account.modules.settings.service.impl;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.settings.dto.request.TermsConditionRequestDTO;
import com.erp.account.modules.settings.dto.response.TermsConditionResponseDTO;
import com.erp.account.modules.settings.entity.TermsCondition;
import com.erp.account.modules.settings.repository.TermsConditionRepository;
import com.erp.account.modules.settings.service.TermsConditionService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TermsConditionServiceImpl implements TermsConditionService {

    private final TermsConditionRepository repository;

    @Override
    @Transactional
    public TermsConditionResponseDTO createTermsCondition(UUID companyId, TermsConditionRequestDTO request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            unsetExistingDefault(resolvedCompanyId, request.getDocumentType());
        }

        TermsCondition entity = new TermsCondition();
        entity.setCompanyId(resolvedCompanyId);
        entity.setDocumentType(request.getDocumentType());
        entity.setTitle(request.getTitle());
        entity.setContent(request.getContent());
        entity.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setCreatedBy(TenantUtils.getCurrentUserId());

        TermsCondition saved = repository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TermsConditionResponseDTO updateTermsCondition(UUID companyId, UUID id, TermsConditionRequestDTO request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        
        TermsCondition entity = repository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("TermsCondition not found with id: " + id));

        if (Boolean.TRUE.equals(request.getIsDefault()) && (!Boolean.TRUE.equals(entity.getIsDefault()) || entity.getDocumentType() != request.getDocumentType())) {
            unsetExistingDefault(resolvedCompanyId, request.getDocumentType());
        }

        entity.setDocumentType(request.getDocumentType());
        entity.setTitle(request.getTitle());
        entity.setContent(request.getContent());
        entity.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        entity.setUpdatedBy(TenantUtils.getCurrentUserId());

        TermsCondition saved = repository.save(entity);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TermsConditionResponseDTO getTermsConditionById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        TermsCondition entity = repository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("TermsCondition not found with id: " + id));
        return mapToResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TermsConditionResponseDTO> getAllTermsConditions(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        List<TermsCondition> list;
        if (documentType != null) {
            list = repository.findByCompanyIdAndDocumentTypeAndIsDeletedFalse(resolvedCompanyId, documentType);
        } else {
            list = repository.findByCompanyIdAndIsDeletedFalse(resolvedCompanyId);
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTermsCondition(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        TermsCondition entity = repository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("TermsCondition not found with id: " + id));
        
        entity.setIsDeleted(true);
        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(TenantUtils.getCurrentUserId());
        repository.save(entity);
    }

    private void unsetExistingDefault(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        repository.findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(companyId, documentType).ifPresent(existingDefault -> {
            existingDefault.setIsDefault(false);
            repository.save(existingDefault);
        });
    }

    private TermsConditionResponseDTO mapToResponse(TermsCondition entity) {
        return TermsConditionResponseDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .isDefault(entity.getIsDefault())
                .isActive(entity.getIsActive())
                .documentType(entity.getDocumentType())
                .build();
    }
}
