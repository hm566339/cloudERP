package com.erp.account.modules.settings.service.impl;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.dto.request.WarrantyTermRequestDTO;
import com.erp.account.modules.settings.dto.response.WarrantyTermResponseDTO;
import com.erp.account.modules.settings.entity.WarrantyTerm;
import com.erp.account.modules.settings.repository.WarrantyTermRepository;
import com.erp.account.modules.settings.service.WarrantyTermService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarrantyTermServiceImpl implements WarrantyTermService {

    private final WarrantyTermRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<WarrantyTermResponseDTO> getAllWarrantyTerms(UUID companyId, SalesDocumentType documentType) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return repository.findByCompanyIdAndDocumentTypeAndIsDeletedFalse(resolvedCompanyId, documentType)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarrantyTermResponseDTO getWarrantyTermById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return mapToDTO(getWarrantyTermEntity(resolvedCompanyId, id));
    }

    @Override
    @Transactional
    public WarrantyTermResponseDTO createWarrantyTerm(UUID companyId, WarrantyTermRequestDTO request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        if (request.getIsDefault() != null && request.getIsDefault()) {
            resetExistingDefault(resolvedCompanyId, request.getDocumentType());
        }

        WarrantyTerm entity = WarrantyTerm.builder()
                .companyId(resolvedCompanyId)
                .name(request.getName())
                .description(request.getDescription())
                .documentType(request.getDocumentType())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return mapToDTO(repository.save(entity));
    }

    @Override
    @Transactional
    public WarrantyTermResponseDTO updateWarrantyTerm(UUID companyId, UUID id, WarrantyTermRequestDTO request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        WarrantyTerm entity = getWarrantyTermEntity(resolvedCompanyId, id);

        if (request.getIsDefault() != null && request.getIsDefault()) {
            resetExistingDefault(resolvedCompanyId, request.getDocumentType());
        }

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setDocumentType(request.getDocumentType());
        
        if (request.getIsDefault() != null) {
            entity.setIsDefault(request.getIsDefault());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }

        return mapToDTO(repository.save(entity));
    }

    @Override
    @Transactional
    public void deleteWarrantyTerm(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        WarrantyTerm entity = getWarrantyTermEntity(resolvedCompanyId, id);
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    private void resetExistingDefault(UUID companyId, SalesDocumentType documentType) {
        repository.findDefaultByCompanyIdAndDocumentType(companyId, documentType)
                .ifPresent(term -> {
                    term.setIsDefault(false);
                    repository.save(term);
                });
    }

    private WarrantyTerm getWarrantyTermEntity(UUID companyId, UUID id) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("WarrantyTerm not found with id " + id));
    }

    private WarrantyTermResponseDTO mapToDTO(WarrantyTerm entity) {
        return WarrantyTermResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .documentType(entity.getDocumentType())
                .isDefault(entity.getIsDefault())
                .isActive(entity.getIsActive())
                .build();
    }
}

