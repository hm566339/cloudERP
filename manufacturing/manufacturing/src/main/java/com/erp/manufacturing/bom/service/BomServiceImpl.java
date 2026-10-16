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

    public BomServiceImpl(BomRepository repository, BomMapper mapper, com.erp.manufacturing.workflow.client.WorkflowClient workflowClient) {
        this.repository = repository;
        this.mapper = mapper;
        this.workflowClient = workflowClient;
    }

    @Override public BomResponse create(BomCreateRequest request) {
        return mapper.toResponse(repository.save(mapper.toEntity(request)));
    }

    @Override public BomResponse update(UUID id, BomUpdateRequest request) {
        Bom entity = repository.findById(id).orElseThrow();
        mapper.updateEntity(request, entity);
        return mapper.toResponse(repository.save(entity));
    }

    @Override public Optional<Bom> getById(UUID id) { return repository.findById(id); }
    @Override public List<Bom> getAll() { return repository.findAll(); }

    @Override
    public BomResponse submitForApproval(UUID id, UUID companyId, String comments) {
        Bom bom = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new IllegalArgumentException("BOM not found with ID: " + id));

        if (bom.getStatus() != null && bom.getStatus() != com.erp.manufacturing.common.enums.BomStatus.DRAFT) {
            throw new IllegalStateException("BOM cannot be submitted from status: " + bom.getStatus());
        }

        workflowClient.submitWorkflow(
                companyId,
                "BOM",
                bom.getId(),
                bom.getBomNumber(),
                comments != null ? comments : "Submitted BOM for approval"
        );
        bom.setStatus(com.erp.manufacturing.common.enums.BomStatus.PENDING_APPROVAL);
        return mapper.toResponse(repository.save(bom));
    }

    @Override public void delete(UUID id) { repository.deleteById(id); }
}
