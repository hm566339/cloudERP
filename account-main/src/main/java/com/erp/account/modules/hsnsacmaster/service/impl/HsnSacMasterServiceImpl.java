package com.erp.account.modules.hsnsacmaster.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterRequest;
import com.erp.account.enums.HsnSacType;
import com.erp.account.common.exception.DuplicateHsnSacException;
import com.erp.account.common.exception.HsnSacInUseException;
import com.erp.account.common.exception.HsnSacNotFoundException;
import com.erp.account.common.exception.InvalidGstSlabException;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterFilterDto;
import com.erp.account.modules.hsnsacmaster.mapper.HsnSacMasterMapper;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.gstslab.repository.GstSlabRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.hsnsacmaster.specification.HsnSacMasterSpecification;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.HsnSacReportHelper;
import com.erp.account.util.HsnSacValidationUtil;
import com.erp.account.modules.hsnsacmaster.service.HsnSacMasterService;
import com.erp.account.util.TenantUtils;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class HsnSacMasterServiceImpl implements HsnSacMasterService {

    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final GstSlabRepository gstSlabRepository;
    private final HsnSacMasterMapper hsnSacMasterMapper;

    @Override
    public PostResponse createHsnSacMaster(RequestWrapper<HsnSacMasterRequest> requestWrapper) {
        if (!TenantUtils.isSystemAdmin()) {
            throw new AccessDeniedException("Access Denied: Only System Admin can create HSN/SAC records");
        }
        HsnSacMasterRequest request = requestWrapper.unwrap();

        HsnSacValidationUtil.validateHsnSacCreateRequest(request.getCode(), request.getDescription(), request.getType(), request.getGstSlabId());

        String codeToUse = request.getCode();
        if (codeToUse == null || codeToUse.isBlank()) {
            codeToUse = generateNextCodeWithRetry(request.getType());
        } else {
            validateUniqueCode(codeToUse);
        }

        log.info("Creating global HSN/SAC record code={}", codeToUse);

        GstSlab gstSlab = gstSlabRepository.findByIdAndIsDeletedFalse(request.getGstSlabId())
                .orElseThrow(() -> new InvalidGstSlabException("GST slab not found or deleted"));

        HsnSacMaster entity = hsnSacMasterMapper.requestToEntity(request);
        entity.setCode(codeToUse);
        entity.setGstSlab(gstSlab);
        entity.setType(request.getType().name());
        entity.setIsDeleted(false);

        hsnSacMasterRepository.save(entity);
        log.info("Created HSN/SAC record id={} code={}", entity.getId(), entity.getCode());

        return PostResponse.builder()
                .message("HSN/SAC record created successfully")
                .id(entity.getId())
                .code(entity.getCode())
                .build();
    }

    @Override
    public PostResponse updateHsnSacMaster(UUID hsnSacId, RequestWrapper<HsnSacMasterRequest> requestWrapper) {
        if (!TenantUtils.isSystemAdmin()) {
            throw new AccessDeniedException("Access Denied: Only System Admin can update HSN/SAC records");
        }
        HsnSacMasterRequest request = requestWrapper.unwrap();
        log.info("Updating global HSN/SAC record id={}", hsnSacId);

        HsnSacValidationUtil.validateHsnSacRequest(request.getCode(), request.getDescription(), request.getType(), request.getGstSlabId());

        HsnSacMaster existing = hsnSacMasterRepository.findByIdAndIsDeletedFalse(hsnSacId)
                .orElseThrow(() -> new HsnSacNotFoundException("HSN/SAC record not found"));

        if (!existing.getCode().equalsIgnoreCase(request.getCode())) {
            validateUniqueCode(request.getCode());
        }

        GstSlab gstSlab = gstSlabRepository.findByIdAndIsDeletedFalse(request.getGstSlabId())
                .orElseThrow(() -> new InvalidGstSlabException("GST slab not found or deleted"));

        hsnSacMasterMapper.updateEntityFromRequest(request, existing);
        existing.setType(request.getType().name());
        existing.setGstSlab(gstSlab);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        hsnSacMasterRepository.save(existing);
        log.info("Updated HSN/SAC record id={} code={}", existing.getId(), existing.getCode());

        return PostResponse.builder()
                .message("HSN/SAC record updated successfully")
                .build();
    }

    @Override
    public PostResponse deleteHsnSacMaster(UUID hsnSacId) {
        if (!TenantUtils.isSystemAdmin()) {
            throw new AccessDeniedException("Access Denied: Only System Admin can delete HSN/SAC records");
        }
        log.info("Soft deleting global HSN/SAC record id={}", hsnSacId);

        HsnSacMaster existing = hsnSacMasterRepository.findByIdAndIsDeletedFalse(hsnSacId)
                .orElseThrow(() -> new HsnSacNotFoundException("HSN/SAC record not found"));

        long invoiceUsageCount = hsnSacMasterRepository.countSalesInvoiceItemsByHsn(hsnSacId);
        long taxTransactionCount = hsnSacMasterRepository.countTaxTransactionsByHsn(hsnSacId);

        if (invoiceUsageCount > 0 || taxTransactionCount > 0) {
            log.error("Cannot delete HSN/SAC id={} because it has related transactions", hsnSacId);
            throw new HsnSacInUseException("HSN/SAC record is in use and cannot be deleted");
        }

        existing.setIsDeleted(true);
        existing.setUpdatedBy(CurrentUserContext.getUserId());
        hsnSacMasterRepository.save(existing);

        return PostResponse.builder()
                .message("HSN/SAC record deleted successfully")
                .build();
    }

    @Override
    public HsnSacMasterResponse getHsnSacMasterById(UUID hsnSacId) {
        log.info("Fetching global HSN/SAC id={}", hsnSacId);

        HsnSacMaster entity = hsnSacMasterRepository.findByIdAndIsDeletedFalse(hsnSacId)
                .orElseThrow(() -> new HsnSacNotFoundException("HSN/SAC record not found"));

        return buildResponseWithCounts(entity);
    }

    @Override
    public HsnSacMasterResponse getHsnSacMasterByCode(String code) {
        log.info("Fetching global HSN/SAC code={}", code);

        HsnSacMaster entity = hsnSacMasterRepository.findByCodeIgnoreCaseAndIsDeletedFalse(code)
                .orElseThrow(() -> new HsnSacNotFoundException("HSN/SAC record not found"));

        return buildResponseWithCounts(entity);
    }

    @Override
    public HsnSacMasterResponseList getAllHsnSacMasters(HsnSacMasterFilterDto filter, Pageable pageable) {
        log.info("Searching global HSN/SAC list with filter and pagination");

        var specification = HsnSacMasterSpecification.getFilterSpecification(filter);

        Page<HsnSacMaster> pageResult = hsnSacMasterRepository.findAll(specification, pageable);
        List<HsnSacMasterResponse> responses = pageResult.getContent().stream()
                .map(this::buildResponseWithCounts)
                .toList();

        PaginationResponse pagination = PaginationResponse.builder()
                .page(pageResult.getNumber() + 1)
                .size(pageResult.getSize())
                .currentPage(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalPages(pageResult.getTotalPages())
                .totalElements(pageResult.getTotalElements())
                .numberOfElements(pageResult.getNumberOfElements())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .hasNext(pageResult.hasNext())
                .hasPrevious(pageResult.hasPrevious())
                .build();

        return HsnSacMasterResponseList.builder()
                .hsnSacMasters(responses)
                .paginationResponse(pagination)
                .build();
    }

    @Override
    public List<HsnSacMasterResponse> generateHsnWiseReport() {
        log.info("Generating global HSN-wise report");

        List<HsnSacMaster> entities = hsnSacMasterRepository.findByTypeAndIsDeletedFalse(HsnSacType.HSN.name());
        return entities.stream()
                .map(this::buildResponseWithCounts)
                .toList();
    }

    @Override
    public List<HsnSacMasterResponse> generateSacWiseReport() {
        log.info("Generating global SAC-wise report");

        List<HsnSacMaster> entities = hsnSacMasterRepository.findByTypeAndIsDeletedFalse(HsnSacType.SAC.name());
        return entities.stream()
                .map(this::buildResponseWithCounts)
                .toList();
    }

    @Override
    public void validateTaxApplicability(UUID hsnSacId) {
        log.info("Validating tax applicability for global HSN/SAC id={}", hsnSacId);

        HsnSacMaster entity = hsnSacMasterRepository.findByIdAndIsDeletedFalse(hsnSacId)
                .orElseThrow(() -> new HsnSacNotFoundException("HSN/SAC record not found"));

        HsnSacValidationUtil.validateTaxApplicability(entity, BigDecimal.ZERO);
    }

    private void validateUniqueCode(String code) {
        if (hsnSacMasterRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(code)) {
            log.error("Duplicate global HSN/SAC code {}", code);
            throw new DuplicateHsnSacException("HSN/SAC code already exists globally");
        }
    }

    private HsnSacMasterResponse buildResponseWithCounts(HsnSacMaster entity) {
        long invoiceUsageCount = hsnSacMasterRepository.countSalesInvoiceItemsByHsn(entity.getId());
        long itemMappingCount = hsnSacMasterRepository.countInvoiceItemsByHsn(entity.getId());
        long taxTransactionCount = hsnSacMasterRepository.countTaxTransactionsByHsn(entity.getId());

        return HsnSacReportHelper.buildReportResponse(entity, invoiceUsageCount, itemMappingCount, taxTransactionCount);
    }

    private synchronized String generateNextCodeWithRetry(HsnSacType type) {
        String prefix = type.name();
        List<String> existingCodes = hsnSacMasterRepository.findCodesByType(prefix);

        int maxNumber = 0;
        for (String c : existingCodes) {
            if (c != null && c.toUpperCase().startsWith(prefix)) {
                String numericPart = c.substring(prefix.length());
                try {
                    int num = Integer.parseInt(numericPart);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                } catch (NumberFormatException ignored) {
                }
            }
        }

        int nextNumber = maxNumber + 1;
        String candidateCode = String.format("%s%04d", prefix, nextNumber);

        while (hsnSacMasterRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(candidateCode)) {
            nextNumber++;
            candidateCode = String.format("%s%04d", prefix, nextNumber);
        }

        return candidateCode;
    }
}
