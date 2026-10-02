package com.erp.manufacturing.bom.controller;

import com.erp.manufacturing.bom.dto.request.BomCreateRequest;
import com.erp.manufacturing.bom.dto.request.BomUpdateRequest;
import com.erp.manufacturing.bom.dto.response.BomResponse;
import com.erp.manufacturing.bom.mapper.BomMapper;
import com.erp.manufacturing.bom.service.BomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boms")
public class BomController {
    private final BomService service;
    private final BomMapper mapper;

    public BomController(BomService service, BomMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<BomResponse> create(@Valid @RequestBody BomCreateRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BomResponse> update(@PathVariable UUID id, @Valid @RequestBody BomUpdateRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BomResponse> getById(@PathVariable UUID id) {
        return service.getById(id).map(mapper::toResponse).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<BomResponse> getAll() {
        return service.getAll().stream().map(mapper::toResponse).toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
