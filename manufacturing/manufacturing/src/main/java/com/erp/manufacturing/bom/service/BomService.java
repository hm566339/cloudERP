package com.erp.manufacturing.bom.service;

import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.dto.request.BomCreateRequest;
import com.erp.manufacturing.bom.dto.request.BomUpdateRequest;
import com.erp.manufacturing.bom.dto.response.BomResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BomService {
    BomResponse create(BomCreateRequest request);
    BomResponse update(UUID id, BomUpdateRequest request);
    Optional<Bom> getById(UUID id);
    List<Bom> getAll();
    void delete(UUID id);
}
