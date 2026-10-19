package com.erp.manufacturing.bom.service;

import com.erp.manufacturing.bom.dto.request.BomCreateRequest;
import com.erp.manufacturing.bom.dto.request.BomUpdateRequest;
import com.erp.manufacturing.bom.dto.response.BomResponse;
import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.mapper.BomMapper;
import com.erp.manufacturing.bom.repository.BomRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BomServiceImpl implements BomService {
    private final BomRepository repository;
    private final BomMapper mapper;
    private final com.erp.manufacturing.workflow.client.WorkflowClient workflowClient;
    private final com.erp.manufacturing.bom.repository.BomRevisionRepository bomRevisionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public BomServiceImpl(BomRepository repository,
                          BomMapper mapper,
                          com.erp.manufacturing.workflow.client.WorkflowClient workflowClient,
                          com.erp.manufacturing.bom.repository.BomRevisionRepository bomRevisionRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.workflowClient = workflowClient;
        this.bomRevisionRepository = bomRevisionRepository;
    }

    public BomServiceImpl(BomRepository repository,
                          BomMapper mapper,
                          com.erp.manufacturing.workflow.client.WorkflowClient workflowClient) {
        this(repository, mapper, workflowClient, null);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BomResponse create(BomCreateRequest request) {
        java.util.UUID companyId = com.erp.manufacturing.util.TenantUtils.resolveCompanyId(request.getCompanyId());
        Bom entity = mapper.toEntity(request);
        entity.setCompanyId(companyId);
        entity.setIsDeleted(false);
        entity.setVersion(0L);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setCreatedBy(com.erp.manufacturing.util.TenantUtils.getCurrentUserId());
        if (entity.getStatus() == null) {
            entity.setStatus(com.erp.manufacturing.common.enums.BomStatus.DRAFT);
        }
        if (entity.getCurrentRevision() == null) {
            entity.setCurrentRevision(1);
        }
        Bom saved = repository.save(entity);

        if (bomRevisionRepository != null) {
            com.erp.manufacturing.bom.entity.BomRevision rev = com.erp.manufacturing.bom.entity.BomRevision.builder()
                    .companyId(companyId)
                    .bom(saved)
                    .revisionNumber(saved.getCurrentRevision())
                    .revisionLabel("Initial Revision")
                    .status(com.erp.manufacturing.common.enums.BomRevisionStatus.DRAFT)
                    .effectiveFrom(saved.getEffectiveFrom())
                    .effectiveTo(saved.getEffectiveTo())
                    .build();
            rev.setCreatedAt(now);
            rev.setUpdatedAt(now);
            rev.setIsDeleted(false);
            rev.setVersion(0L);
            rev.setCreatedBy(com.erp.manufacturing.util.TenantUtils.getCurrentUserId());
            bomRevisionRepository.save(rev);
        }

        return mapper.toResponse(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BomResponse update(UUID id, BomUpdateRequest request) {
        UUID companyId = com.erp.manufacturing.util.TenantUtils.getCurrentCompanyId();
        Bom entity = (companyId != null ? repository.findByIdAndCompanyId(id, companyId) : repository.findById(id))
                .orElseThrow(() -> new com.erp.manufacturing.common.exception.ResourceNotFoundException("BOM not found with ID: " + id));
        mapper.updateEntity(request, entity);
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        entity.setUpdatedBy(com.erp.manufacturing.util.TenantUtils.getCurrentUserId());
        return mapper.toResponse(repository.save(entity));
    }

    @Override
    public Optional<Bom> getById(UUID id) {
        UUID companyId = com.erp.manufacturing.util.TenantUtils.getCurrentCompanyId();
        if (companyId == null) {
            return repository.findById(id);
        }
        return repository.findByIdAndCompanyId(id, companyId);
    }

    @Override
    public List<Bom> getAll() {
        UUID companyId = com.erp.manufacturing.util.TenantUtils.getCurrentCompanyId();
        if (companyId == null) {
            return repository.findAll();
        }
        return repository.findByCompanyId(companyId);
    }

    @Override
    public BomResponse submitForApproval(UUID id, UUID companyId, String comments) {
        UUID resolvedCompanyId = com.erp.manufacturing.util.TenantUtils.resolveCompanyId(companyId);
        Bom bom = repository.findByIdAndCompanyId(id, resolvedCompanyId)
                .orElseThrow(() -> new IllegalArgumentException("BOM not found with ID: " + id));

        if (bom.getStatus() != null && bom.getStatus() != com.erp.manufacturing.common.enums.BomStatus.DRAFT) {
            throw new IllegalStateException("BOM cannot be submitted from status: " + bom.getStatus());
        }

        workflowClient.submitWorkflow(
                resolvedCompanyId,
                "BOM",
                bom.getId(),
                bom.getBomNumber(),
                comments != null ? comments : "Submitted BOM for approval"
        );
        bom.setStatus(com.erp.manufacturing.common.enums.BomStatus.PENDING_APPROVAL);
        return mapper.toResponse(repository.save(bom));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void delete(UUID id) {
        UUID companyId = com.erp.manufacturing.util.TenantUtils.getCurrentCompanyId();
        Bom entity = (companyId != null ? repository.findByIdAndCompanyId(id, companyId) : repository.findById(id))
                .orElseThrow(() -> new com.erp.manufacturing.common.exception.ResourceNotFoundException("BOM not found with ID: " + id));
        entity.setIsDeleted(true);
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        repository.save(entity);
    }
}
