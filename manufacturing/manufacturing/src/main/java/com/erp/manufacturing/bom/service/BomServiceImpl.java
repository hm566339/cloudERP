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

    public BomServiceImpl(BomRepository repository, BomMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
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
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
