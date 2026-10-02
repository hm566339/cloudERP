package com.erp.account.modules.purchaserequisition.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.purchaserequisition.dto.*;
import com.erp.account.modules.purchaserequisition.entity.*;
import com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
import com.erp.account.modules.auth.service.UserLookupService;
import com.erp.account.modules.purchaserequisition.service.PurchaseRequisitionService;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.WarehouseLocationNameDto;
import com.erp.account.common.service.WarehouseLookupService;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseRequisitionServiceImpl implements PurchaseRequisitionService {
    private final PurchaseRequisitionRepository repository;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final UserLookupService userLookupService;
    private final WarehouseLookupService warehouseLookupService;

    @Override
    @Transactional
    public PurchaseRequisitionResponse create(UUID companyId, PurchaseRequisitionRequest request) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        Company companyEntity = companyRepository.findById(company)
                .orElseThrow(() -> new BadRequestException("Company not found"));
        validateDate(request.getRequiredDate());
        UUID requesterId = resolveRequesterId(request.getRequesterId());
        PurchaseRequisition entity = PurchaseRequisition.builder()
                .companyId(company).company(companyEntity)
                .requisitionNumber(
                        voucherSequenceService.generateNextPurchaseRequisitionNumber(company, LocalDate.now()))
                .requesterId(requesterId)
                .requisitionName(request.getRequisitionName())
                .departmentId(request.getDepartmentId()).costCenterId(request.getCostCenterId())
                .requiredDate(request.getRequiredDate())
                .priority(StringUtils.defaultIfBlank(request.getPriority(), "NORMAL"))
                .purpose(request.getPurpose()).remarks(request.getRemarks()).build();
        addItems(entity, request);
        PurchaseRequisition saved = repository.save(entity);
        return toResponseWithResolvedName(saved);
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponse update(UUID companyId, UUID id, PurchaseRequisitionRequest request) {
        PurchaseRequisition entity = load(companyId, id);
        if (entity.getStatus() != PurchaseRequisitionStatus.DRAFT)
            throw new BadRequestException("Only DRAFT requisitions can be edited");
        validateDate(request.getRequiredDate());
        entity.setRequesterId(resolveRequesterId(request.getRequesterId()));
        entity.setDepartmentId(request.getDepartmentId());
        entity.setCostCenterId(request.getCostCenterId());
        entity.setRequiredDate(request.getRequiredDate());
        entity.setPriority(StringUtils.defaultIfBlank(request.getPriority(), "NORMAL"));
        entity.setPurpose(request.getPurpose());
        entity.setRemarks(request.getRemarks());
        entity.getItems().clear();
        addItems(entity, request);
        PurchaseRequisition saved = repository.save(entity);
        return toResponseWithResolvedName(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseRequisitionResponse get(UUID companyId, UUID id) {
        PurchaseRequisition entity = load(companyId, id);
        return toResponseWithResolvedName(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseRequisitionResponse> list(UUID companyId, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        Page<PurchaseRequisition> page;
        if (resolvedCompanyId == null) {
            page = repository.findAll(pageable);
        } else {
            page = repository.findByCompanyIdAndIsDeletedFalse(resolvedCompanyId, pageable);
        }
        Set<UUID> requesterIds = page.getContent().stream()
                .map(PurchaseRequisition::getRequesterId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> requesterNames = userLookupService != null
                ? userLookupService.resolveFullNames(requesterIds)
                : Collections.emptyMap();

        Map<WarehouseLocationKey, WarehouseLocationNameDto> whNames = Collections.emptyMap();
        if (warehouseLookupService != null) {
            Set<WarehouseLocationKey> keys = page.getContent().stream()
                    .filter(pr -> pr.getItems() != null)
                    .flatMap(pr -> pr.getItems().stream())
                    .filter(i -> i.getWarehouseId() != null)
                    .map(i -> new WarehouseLocationKey(i.getWarehouseId(), i.getLocationId()))
                    .collect(Collectors.toSet());
            whNames = warehouseLookupService.resolveAll(keys);
        }
        final Map<WarehouseLocationKey, WarehouseLocationNameDto> finalWhNames = whNames;
        return page.map(e -> toResponse(e, requesterNames, finalWhNames));
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponse submit(UUID companyId, UUID id) {
        PurchaseRequisition entity = loadForUpdate(companyId, id);
        if (entity.getStatus() != PurchaseRequisitionStatus.DRAFT)
            throw new BadRequestException("Only DRAFT requisitions can be submitted");
        entity.setStatus(PurchaseRequisitionStatus.SUBMITTED);
        entity.setSubmittedBy(TenantUtils.getCurrentUserId());
        entity.setSubmittedAt(LocalDateTime.now());
        return toResponseWithResolvedName(repository.save(entity));
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponse approve(UUID companyId, UUID id) {
        PurchaseRequisition entity = loadForUpdate(companyId, id);
        if (entity.getStatus() != PurchaseRequisitionStatus.SUBMITTED)
            throw new BadRequestException("Only SUBMITTED requisitions can be approved");
        UUID user = TenantUtils.getCurrentUserId();
        if (user != null && user.equals(entity.getRequesterId()) && !isPrivilegedApprover())
            throw new BadRequestException("Requester cannot approve their own requisition");
        entity.setStatus(PurchaseRequisitionStatus.APPROVED);
        entity.setApprovedBy(user);
        entity.setApprovedAt(LocalDateTime.now());
        return toResponseWithResolvedName(repository.save(entity));
    }

    /**
     * FINANCE_MANAGER, SYSTEM_ADMIN and CFO may approve their own requisition.
     * All other roles remain blocked from self-approval.
     */
    private boolean isPrivilegedApprover() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> {
            if (a.getAuthority() == null) return false;
            String role = a.getAuthority().trim().toUpperCase();
            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }
            return "CFO".equals(role)
                    || "SYSTEM_ADMIN".equals(role)
                    || "FINANCE_MANAGER".equals(role);
        });
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponse reject(UUID companyId, UUID id, String reason) {
        PurchaseRequisition entity = loadForUpdate(companyId, id);
        if (entity.getStatus() != PurchaseRequisitionStatus.SUBMITTED)
            throw new BadRequestException("Only SUBMITTED requisitions can be rejected");
        if (StringUtils.isBlank(reason))
            throw new BadRequestException("Rejection reason is required");
        entity.setStatus(PurchaseRequisitionStatus.REJECTED);
        entity.setRejectedBy(TenantUtils.getCurrentUserId());
        entity.setRejectedAt(LocalDateTime.now());
        entity.setRejectionReason(reason);
        return toResponseWithResolvedName(repository.save(entity));
    }

    @Override
    @Transactional
    public PurchaseRequisitionResponse cancel(UUID companyId, UUID id) {
        PurchaseRequisition entity = loadForUpdate(companyId, id);
        if (entity.getStatus() == PurchaseRequisitionStatus.CANCELLED
                || entity.getStatus() == PurchaseRequisitionStatus.APPROVED)
            throw new BadRequestException("Requisition cannot be cancelled in status " + entity.getStatus());
        entity.setStatus(PurchaseRequisitionStatus.CANCELLED);
        entity.setCancelledBy(TenantUtils.getCurrentUserId());
        entity.setCancelledAt(LocalDateTime.now());
        return toResponseWithResolvedName(repository.save(entity));
    }

    private PurchaseRequisition load(UUID companyId, UUID id) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(id, TenantUtils.resolveCompanyId(companyId))
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found: " + id));
    }

    private PurchaseRequisition loadForUpdate(UUID companyId, UUID id) {
        return repository.findForUpdate(id, TenantUtils.resolveCompanyId(companyId))
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Requisition not found: " + id));
    }

    private void validateDate(LocalDate date) {
        if (date == null || date.isBefore(LocalDate.now()))
            throw new BadRequestException("Required date must be today or later");
    }

    private UUID resolveRequesterId(UUID requestedRequesterId) {
        UUID authenticatedUserId = TenantUtils.getCurrentUserId();
        if (authenticatedUserId == null)
            throw new BadRequestException("Authenticated requester is required");
        if (requestedRequesterId != null && !authenticatedUserId.equals(requestedRequesterId)) {
            throw new BadRequestException("Requester must be the authenticated user", "REQUESTER_FORGERY");
        }
        return authenticatedUserId;
    }

    private void addItems(PurchaseRequisition entity, PurchaseRequisitionRequest request) {
        for (PurchaseRequisitionItemRequest item : request.getItems()) {
            if (item.getRequestedQuantity() == null || item.getRequestedQuantity().signum() <= 0)
                throw new BadRequestException("Requested quantity must be greater than zero");
            BigDecimal price = item.getEstimatedUnitPrice() == null ? BigDecimal.ZERO : item.getEstimatedUnitPrice();
            if (price.signum() < 0)
                throw new BadRequestException("Estimated price cannot be negative");
            entity.addItem(PurchaseRequisitionItem.builder().itemId(item.getItemId()).itemName(item.getItemName())
                    .description(item.getDescription()).itemType(item.getItemType())
                    .requestedQuantity(item.getRequestedQuantity()).unit(item.getUnit()).estimatedUnitPrice(price)
                    .estimatedAmount(price.multiply(item.getRequestedQuantity())).requiredDate(item.getRequiredDate())
                    .warehouseId(item.getWarehouseId()).locationId(item.getLocationId()).remarks(item.getRemarks())
                    .build());
        }
    }

    private PurchaseRequisitionResponse toResponseWithResolvedName(PurchaseRequisition e) {
        Map<UUID, String> requesterNames = Collections.emptyMap();
        if (e.getRequesterId() != null && userLookupService != null) {
            requesterNames = userLookupService.resolveFullNames(Set.of(e.getRequesterId()));
        }
        Map<WarehouseLocationKey, WarehouseLocationNameDto> whNames = Collections.emptyMap();
        if (warehouseLookupService != null && e.getItems() != null) {
            Set<WarehouseLocationKey> keys = e.getItems().stream()
                    .filter(i -> i.getWarehouseId() != null)
                    .map(i -> new WarehouseLocationKey(i.getWarehouseId(), i.getLocationId()))
                    .collect(Collectors.toSet());
            whNames = warehouseLookupService.resolveAll(keys);
        }
        return toResponse(e, requesterNames, whNames);
    }

    private PurchaseRequisitionResponse toResponse(PurchaseRequisition e, Map<UUID, String> requesterNames,
            Map<WarehouseLocationKey, WarehouseLocationNameDto> whNames) {

        return PurchaseRequisitionResponse.builder().id(e.getId()).companyId(e.getCompanyId())
                .requisitionNumber(e.getRequisitionNumber()).requesterId(e.getRequesterId())
                .requesterName((requesterNames != null && e.getRequesterId() != null) ? requesterNames.get(e.getRequesterId()) : null)
                .departmentId(e.getDepartmentId())
                .costCenterId(e.getCostCenterId())
                .requiredDate(e.getRequiredDate()).priority(e.getPriority()).purpose(e.getPurpose())
                .remarks(e.getRemarks()).status(e.getStatus()).submittedBy(e.getSubmittedBy())
                .submittedAt(e.getSubmittedAt()).approvedBy(e.getApprovedBy()).approvedAt(e.getApprovedAt())
                .rejectedBy(e.getRejectedBy()).rejectedAt(e.getRejectedAt()).rejectionReason(e.getRejectionReason())
                .cancelledBy(e.getCancelledBy()).cancelledAt(e.getCancelledAt())
                .items(e.getItems() == null ? Collections.emptyList() : e.getItems().stream()
                        .map(i -> {
                            WarehouseLocationKey key = new WarehouseLocationKey(i.getWarehouseId(), i.getLocationId());
                            WarehouseLocationNameDto whLoc = whNames != null ? whNames.get(key) : null;
                            return PurchaseRequisitionResponse.Item.builder().id(i.getId()).itemId(i.getItemId())
                                    .itemName(i.getItemName()).description(i.getDescription())
                                    .requestedQuantity(i.getRequestedQuantity()).unit(i.getUnit())
                                    .estimatedUnitPrice(i.getEstimatedUnitPrice()).estimatedAmount(i.getEstimatedAmount())
                                    .requiredDate(i.getRequiredDate())
                                    .warehouseId(i.getWarehouseId())
                                    .warehouseName(whLoc != null ? whLoc.getWarehouseName() : null)
                                    .locationId(i.getLocationId())
                                    .locationName(whLoc != null ? whLoc.getLocationName() : null)
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .build();
    }
}
