package com.erp.account.modules.settings.service.impl;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.dto.request.DeliveryTermRequestDTO;
import com.erp.account.modules.settings.dto.response.DeliveryTermResponseDTO;
import com.erp.account.modules.settings.entity.DeliveryTerm;
import com.erp.account.modules.settings.repository.DeliveryTermRepository;
import com.erp.account.modules.settings.service.DeliveryTermService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryTermServiceImpl implements DeliveryTermService {

    private final DeliveryTermRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<DeliveryTermResponseDTO> getAllDeliveryTerms(UUID companyId, SalesDocumentType documentType) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return repository.findByCompanyIdAndDocumentTypeAndIsDeletedFalse(resolvedCompanyId, documentType)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryTermResponseDTO getDeliveryTermById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        return mapToDTO(getDeliveryTermEntity(resolvedCompanyId, id));
    }

    @Override
    @Transactional
    public DeliveryTermResponseDTO createDeliveryTerm(UUID companyId, DeliveryTermRequestDTO request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        if (request.getIsDefault() != null && request.getIsDefault()) {
            resetExistingDefault(resolvedCompanyId, request.getDocumentType());
        }

        DeliveryTerm entity = DeliveryTerm.builder()
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
    public DeliveryTermResponseDTO updateDeliveryTerm(UUID companyId, UUID id, DeliveryTermRequestDTO request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryTerm entity = getDeliveryTermEntity(resolvedCompanyId, id);

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
    public void deleteDeliveryTerm(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DeliveryTerm entity = getDeliveryTermEntity(resolvedCompanyId, id);
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

    private DeliveryTerm getDeliveryTermEntity(UUID companyId, UUID id) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryTerm not found with id " + id));
    }

    private DeliveryTermResponseDTO mapToDTO(DeliveryTerm entity) {
        return DeliveryTermResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .documentType(entity.getDocumentType())
                .isDefault(entity.getIsDefault())
                .isActive(entity.getIsActive())
                .build();
    }
}

