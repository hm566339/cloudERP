package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CreateModuleRequest;
import com.erp.auth_service.dto.request.UpdateModuleRequest;
import com.erp.auth_service.dto.request.UpdateModuleStatusRequest;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mapper.ModuleMapper;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Transactional
public class ModuleServiceImpl implements ModuleService {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ModuleMapper moduleMapper;
    private final ModuleRepository moduleRepository;

    @Override
    public ModuleCreateResponse createModule(CreateModuleRequest request) {

        if (moduleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BadRequestException("Module name already exists");
        }

        if (moduleRepository.existsByHostIgnoreCase(request.getHost())) {
            throw new BadRequestException("Module host already exists");
        }

        UUID clientId = UUID.randomUUID();

        String rawSecret = generateClientSecret(48);

        Module module = moduleMapper.toModule(request);
        module.setClientId(clientId);
        module.setClientSecret(rawSecret);
        module.setModuleStatus(true);

        Module saved = moduleRepository.save(module);

        ModuleCreateResponse response = moduleMapper.toModuleCreateResponse(saved);
        response.setClientSecret(rawSecret);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public ModuleListResponse getAllModules(
            Boolean status,
            int page,
            int pageSize,
            String search) {
        int validatedPage = Math.max(page, 1);
        int validatedPageSize = Math.min(Math.max(pageSize, 1), 100);

        Pageable pageable = PageRequest.of(
                validatedPage - 1,
                validatedPageSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        String keyword = search == null ? "" : search.trim();

        Page<Module> modulePage = moduleRepository.findAllWithFilters(
                status,
                keyword,
                pageable);

        return ModuleListResponse.builder()
                .modules(
                        moduleMapper.toModuleSummaryResponseList(
                                modulePage.getContent()))
                .pagination(
                        PaginationResponse.builder()
                                .currentPage(validatedPage)
                                .pageSize(validatedPageSize)
                                .totalPages(modulePage.getTotalPages())
                                .totalCount(modulePage.getTotalElements())
                                .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ModuleSummaryResponse getModuleById(UUID moduleId) {

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        return moduleMapper.toModuleSummaryResponse(module);
    }

    @Override
    public ModuleResponse updateModule(UUID moduleId, UpdateModuleRequest request) {

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        // 🔥 duplicate checks
        if (request.getName() != null &&
                !request.getName().equalsIgnoreCase(module.getName()) &&
                moduleRepository.existsByNameIgnoreCase(request.getName())) {

            throw new BadRequestException("Module name already exists");
        }

        if (request.getHost() != null &&
                !request.getHost().equalsIgnoreCase(module.getHost()) &&
                moduleRepository.existsByHostIgnoreCase(request.getHost())) {

            throw new ResourceNotFoundException("Module host already exists");
        }

        if (request.getName() != null) {
            module.setName(request.getName().trim());
        }

        if (request.getHost() != null) {
            module.setHost(request.getHost().trim());
        }

        Module updated = moduleRepository.save(module);
        return moduleMapper.toModuleResponse(updated);
    }

    @Override
    public ModuleStatusResponse updateModuleStatus(UUID moduleId, UpdateModuleStatusRequest request) {

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        module.setModuleStatus(request.getModuleStatus());

        Module updated = moduleRepository.save(module);

        return ModuleStatusResponse.builder()
                .id(updated.getId())
                .moduleStatus(updated.getModuleStatus())
                .updatedAt(updated.getUpdatedAt())
                .build();
    }

    @Override
    public RotateSecretResponse rotateSecret(UUID moduleId) {

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        String rawSecret = generateClientSecret(48);

        module.setClientSecret(rawSecret);
        moduleRepository.save(module);

        return RotateSecretResponse.builder()
                .clientId(module.getClientId().toString())
                .clientSecret(rawSecret)
                .build();
    }

    @Override
    public MessageResponse deleteModule(UUID moduleId) {

        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        if ("SYSTEM_ADMIN".equalsIgnoreCase(module.getName())
                || "SSO".equalsIgnoreCase(module.getName())
                || "CORE".equalsIgnoreCase(module.getName())) {
            throw new BadRequestException("Core platform module [" + module.getName() + "] cannot be deactivated or deleted");
        }

        module.setModuleStatus(false);
        moduleRepository.save(module);
        return new MessageResponse("Module disabled successfully");
    }

    @Override
    public List<String> getAllHosts() {
        return moduleRepository.findAllActiveHosts();
    }

    private String generateClientSecret(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(SECURE_RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}