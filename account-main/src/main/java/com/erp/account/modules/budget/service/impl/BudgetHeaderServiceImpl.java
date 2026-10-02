package com.erp.account.modules.budget.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.account.modules.budget.dto.response.BudgetHeaderResponse;
import com.erp.account.modules.budget.dto.response.BudgetHeaderResponseList;
import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.modules.budget.dto.request.BudgetHeaderFilterDto;
import com.erp.account.modules.budget.dto.request.BudgetHeaderRequest;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.common.exception.BudgetHeaderNotFoundException;
import com.erp.account.common.exception.BudgetLineNotFoundException;
import com.erp.account.common.exception.DuplicateBudgetHeaderException;
import com.erp.account.common.exception.InvalidBudgetRequestException;
import com.erp.account.modules.budget.mapper.BudgetHeaderMapper;
import com.erp.account.modules.budget.mapper.BudgetLineMapper;
import com.erp.account.modules.budget.entity.BudgetHeader;
import com.erp.account.modules.budget.entity.BudgetLine;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.budget.repository.BudgetHeaderRepository;
import com.erp.account.modules.budget.repository.BudgetLineRepository;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.BudgetValidationUtil;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.budget.service.BudgetHeaderService;
import com.erp.account.modules.budget.specification.BudgetHeaderSpecification;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.erp.account.common.dto.request.RequestWrapper;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class BudgetHeaderServiceImpl implements BudgetHeaderService {

    private final BudgetHeaderRepository budgetHeaderRepository;
    private final BudgetLineRepository budgetLineRepository;
    private final CompanyRepository companyRepository;
    private final FiscalYearRepository fiscalYearRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final BudgetHeaderMapper budgetHeaderMapper;
    private final BudgetLineMapper budgetLineMapper;

    @Override
    public PostResponse createBudgetHeader(RequestWrapper<BudgetHeaderRequest> requestWrapper, UUID companyId) {
        BudgetHeaderRequest request = requestWrapper.unwrap();
        
       UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        log.info("Creating budget header for companyId={} name={}", resolvedCompanyId, request.getBudgetName());
        BudgetValidationUtil.validateBudgetHeaderRequest(request);

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new InvalidBudgetRequestException("Company not found"));

        FiscalYear fiscalYear = fiscalYearRepository.findByIdAndCompanyId(request.getFiscalYearId(), resolvedCompanyId)
                .orElseThrow(() -> new InvalidBudgetRequestException(
                        "Fiscal year does not belong to the selected company or was not found"));

        log.debug("Validated fiscalYearId={} belongs to companyId={}", request.getFiscalYearId(), resolvedCompanyId);

        if (budgetHeaderRepository.existsByCompanyIdAndFiscalYearIdAndBudgetNameIgnoreCaseAndIsDeletedFalse(
                resolvedCompanyId, request.getFiscalYearId(), request.getBudgetName())) {
            throw new DuplicateBudgetHeaderException("A budget with the same name already exists for this fiscal year");
        }

        BudgetHeader budgetHeader = budgetHeaderMapper.requestToEntity(request);
        budgetHeader.setCompany(company);
        budgetHeader.setFiscalYear(fiscalYear);
        budgetHeader.setIsDeleted(false);

        budgetHeaderRepository.save(budgetHeader);

        return PostResponse.builder()
                .message("Budget header created successfully")
                .build();
    }

    @Override
    public PostResponse updateBudgetHeader(UUID budgetHeaderId, RequestWrapper<BudgetHeaderRequest> requestWrapper) {
        BudgetHeaderRequest request = requestWrapper.unwrap();
        log.info("Updating budget header id={}", budgetHeaderId);

        BudgetValidationUtil.validateBudgetHeaderRequest(request);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetHeader existing;
        if (isSystemAdmin) {
            existing = budgetHeaderRepository.findByIdAndIsDeletedFalse(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            existing = budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }

        UUID targetCompanyId = existing.getCompany().getId();

        if (!existing.getBudgetName().equalsIgnoreCase(request.getBudgetName()) &&
                budgetHeaderRepository.existsByCompanyIdAndFiscalYearIdAndBudgetNameIgnoreCaseAndIsDeletedFalse(
                        targetCompanyId, request.getFiscalYearId(), request.getBudgetName())) {
            throw new DuplicateBudgetHeaderException("A budget with the same name already exists for this fiscal year");
        }

        FiscalYear fiscalYear = fiscalYearRepository.findByIdAndCompanyId(request.getFiscalYearId(), targetCompanyId)
                .orElseThrow(() -> new InvalidBudgetRequestException(
                        "Fiscal year does not belong to the selected company or was not found"));

        log.debug("Validated fiscalYearId={} belongs to companyId={}" , request.getFiscalYearId(), targetCompanyId);

        budgetHeaderMapper.updateEntityFromRequest(request, existing);
        existing.setFiscalYear(fiscalYear);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        budgetHeaderRepository.save(existing);

        return PostResponse.builder()
                .message("Budget header updated successfully")
                .build();
    }

    @Override
    public PostResponse deleteBudgetHeader(UUID budgetHeaderId) {
        log.info("Deleting budget header id={}", budgetHeaderId);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetHeader existing;
        if (isSystemAdmin) {
            existing = budgetHeaderRepository.findByIdAndIsDeletedFalse(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            existing = budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }

        List<BudgetLine> lines = budgetLineRepository.findAllByBudgetHeaderIdAndIsDeletedFalse(budgetHeaderId);
        if (!lines.isEmpty()) {
            throw new InvalidBudgetRequestException("Budget header cannot be deleted while it has budget lines");
        }

        existing.setIsDeleted(true);
        existing.setUpdatedBy(CurrentUserContext.getUserId());
        budgetHeaderRepository.save(existing);

        return PostResponse.builder()
                .message("Budget header deleted successfully")
                .build();
    }

    @Override
    public BudgetHeaderResponse getBudgetHeaderById(UUID budgetHeaderId) {
        log.info("Fetching budget header id={}", budgetHeaderId);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetHeader existing;
        if (isSystemAdmin) {
            existing = budgetHeaderRepository.findByIdAndIsDeletedFalse(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            existing = budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }

        List<BudgetLine> lines = budgetLineRepository.findAllByBudgetHeaderIdAndIsDeletedFalse(budgetHeaderId);
        BudgetHeaderResponse response = buildHeaderResponse(existing, lines);

        return response;
    }

    @Override
    public BudgetHeaderResponseList getBudgetHeaders(BudgetHeaderFilterDto filter, Pageable pageable) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();
        log.info("Listing budget headers - SystemAdmin: {}, context companyId={}", isSystemAdmin, companyId);

        UUID companyIdToFilter = isSystemAdmin ? null : companyId;
        if (!isSystemAdmin && companyId == null) {
            log.warn("Access Denied: Non-system admin user has no associated company in context");
            throw new InvalidBudgetRequestException("Company context is required");
        }

        Specification<BudgetHeader> spec = BudgetHeaderSpecification.getFilterSpecification(filter, companyIdToFilter);
        Page<BudgetHeader> headerPage = budgetHeaderRepository.findAll(spec, pageable);

        List<BudgetHeaderResponse> responses = headerPage.getContent().stream()
                .map(header -> {
                    List<BudgetLine> lines = budgetLineRepository.findAllByBudgetHeaderIdAndIsDeletedFalse(header.getId());
                    return buildHeaderResponse(header, lines);
                })
                .collect(Collectors.toList());

        return BudgetHeaderResponseList.builder()
                .budgetHeaders(responses)
                .paginationResponse(PaginationResponse.builder()
                        .page(headerPage.getNumber() + 1)
                        .size(headerPage.getSize())
                        .currentPage(headerPage.getNumber())
                        .pageSize(headerPage.getSize())
                        .totalPages(headerPage.getTotalPages())
                        .totalElements(headerPage.getTotalElements())
                        .numberOfElements(headerPage.getNumberOfElements())
                        .first(headerPage.isFirst())
                        .last(headerPage.isLast())
                        .hasNext(headerPage.hasNext())
                        .hasPrevious(headerPage.hasPrevious())
                        .build())
                .build();
    }

    @Override
    public PostResponse createBudgetLine(UUID budgetHeaderId, RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        log.info("Creating budget line for headerId={}", budgetHeaderId);

        BudgetValidationUtil.validateBudgetLineRequest(request);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetHeader header;
        if (isSystemAdmin) {
            header = budgetHeaderRepository.findByIdAndIsDeletedFalse(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            header = budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }

        validateBudgetHeaderMutable(header);

        ChartOfAccount account = chartOfAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new InvalidBudgetRequestException("Chart of account not found"));
        if (account.getIsDeleted() != null && account.getIsDeleted()) {
            throw new InvalidBudgetRequestException("Account is deleted");
        }
        if (account.getCompany() == null || !Objects.equals(account.getCompany().getId(), header.getCompany().getId())) {
            throw new InvalidBudgetRequestException("Account does not belong to the selected company");
        }
        if (account.getPostingAllowed() == null || !account.getPostingAllowed()) {
            throw new InvalidBudgetRequestException("Budget lines must use a posting-enabled account");
        }

        BigDecimal remainingAllocation = calculateRemainingAllocation(budgetHeaderId);
        if (request.getAllocatedAmount().compareTo(remainingAllocation) > 0) {
            throw new InvalidBudgetRequestException("Allocated amount exceeds remaining budget available");
        }

        BudgetLine budgetLine = budgetLineMapper.requestToEntity(request);
        budgetLine.setCompany(header.getCompany());
        budgetLine.setBudgetHeader(header);
        budgetLine.setAccount(account);
        budgetLine.setIsDeleted(false);

        budgetLineRepository.save(budgetLine);

        return PostResponse.builder()
                .message("Budget line created successfully")
                .build();
    }

    @Override
    public PostResponse updateBudgetLine(UUID lineId, RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        log.info("Updating budget line id={}", lineId);

        BudgetValidationUtil.validateBudgetLineRequest(request);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine existing;
        if (isSystemAdmin) {
            existing = budgetLineRepository.findByIdAndIsDeletedFalse(lineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            existing = budgetLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(lineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        BudgetHeader header = existing.getBudgetHeader();
        validateBudgetHeaderMutable(header);

        ChartOfAccount account = chartOfAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new InvalidBudgetRequestException("Chart of account not found"));
        if (account.getIsDeleted() != null && account.getIsDeleted()) {
            throw new InvalidBudgetRequestException("Account is deleted");
        }
        if (account.getCompany() == null || !Objects.equals(account.getCompany().getId(), header.getCompany().getId())) {
            throw new InvalidBudgetRequestException("Account does not belong to the selected company");
        }
        if (account.getPostingAllowed() == null || !account.getPostingAllowed()) {
            throw new InvalidBudgetRequestException("Budget lines must use a posting-enabled account");
        }

        BigDecimal currentAllocated = calculateRemainingAllocation(header.getId()).add(
                existing.getAllocatedAmount() != null ? existing.getAllocatedAmount() : BigDecimal.ZERO);
        if (request.getAllocatedAmount().compareTo(currentAllocated) > 0) {
            throw new InvalidBudgetRequestException("Allocated amount exceeds remaining budget available");
        }

        budgetLineMapper.updateEntityFromRequest(request, existing);
        existing.setAccount(account);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        budgetLineRepository.save(existing);

        return PostResponse.builder()
                .message("Budget line updated successfully")
                .build();
    }

    @Override
    public PostResponse deleteBudgetLine(UUID lineId) {
        log.info("Deleting budget line id={}", lineId);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine existing;
        if (isSystemAdmin) {
            existing = budgetLineRepository.findByIdAndIsDeletedFalse(lineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            existing = budgetLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(lineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        validateBudgetHeaderMutable(existing.getBudgetHeader());

        existing.setIsDeleted(true);
        existing.setUpdatedBy(CurrentUserContext.getUserId());
        budgetLineRepository.save(existing);

        return PostResponse.builder()
                .message("Budget line deleted successfully")
                .build();
    }

    @Override
    public List<BudgetLineResponse> getBudgetLinesByHeader(UUID budgetHeaderId) {
        log.info("Listing budget lines for headerId={}", budgetHeaderId);

        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        if (isSystemAdmin) {
            budgetHeaderRepository.findByIdAndIsDeletedFalse(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }

        List<BudgetLine> lines = budgetLineRepository.findAllByBudgetHeaderIdAndIsDeletedFalse(budgetHeaderId);
        return budgetLineMapper.entityListToResponseList(lines);
    }

    private BudgetHeaderResponse buildHeaderResponse(BudgetHeader header, List<BudgetLine> lines) {
        List<BudgetLineResponse> lineResponses = budgetLineMapper.entityListToResponseList(lines);
        BigDecimal totalAllocated = lines.stream()
                .map(line -> line.getAllocatedAmount() != null ? line.getAllocatedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUtilized = lines.stream()
                .map(line -> line.getUtilizedAmount() != null ? line.getUtilizedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBudget = header.getTotalBudget() != null ? header.getTotalBudget() : BigDecimal.ZERO;
        BigDecimal remainingBudget = totalBudget.subtract(totalAllocated);

        BudgetHeaderResponse response = budgetHeaderMapper.entityToResponse(header);
        response.setTotalAllocated(totalAllocated);
        response.setTotalUtilized(totalUtilized);
        response.setRemainingBudget(remainingBudget);
        response.setBudgetLines(lineResponses);
        return response;
    }

    private BigDecimal calculateRemainingAllocation(UUID budgetHeaderId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        List<BudgetLine> lines;
        BudgetHeader header;
        if (TenantUtils.isSystemAdmin()) {
            lines = budgetLineRepository.findAllByBudgetHeaderIdAndIsDeletedFalse(budgetHeaderId);
            header = budgetHeaderRepository.findById(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Company context is required");
            }
            lines = budgetLineRepository.findAllByCompanyIdAndBudgetHeaderIdAndIsDeletedFalse(companyId, budgetHeaderId);
            header = budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }
        BigDecimal allocated = lines.stream()
                .map(line -> line.getAllocatedAmount() != null ? line.getAllocatedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBudget = header.getTotalBudget() != null ? header.getTotalBudget() : BigDecimal.ZERO;
        return totalBudget.subtract(allocated);
    }

    private void validateBudgetHeaderMutable(BudgetHeader header) {
        if (header == null || header.getIsDeleted() != null && header.getIsDeleted()) {
            throw new BudgetHeaderNotFoundException("Budget header not found");
        }
    }
}

