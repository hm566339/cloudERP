package com.erp.account.modules.expensecategory.service.impl;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.exception.DuplicateResourceException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryFilterDto;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryRequest;
import com.erp.account.modules.expensecategory.dto.response.ExpenseCategoryResponse;
import com.erp.account.modules.expensecategory.dto.response.ExpenseCategoryResponseList;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expensecategory.service.ExpenseCategoryService;
import com.erp.account.modules.expensecategory.specification.ExpenseCategorySpecification;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseCategoryServiceImpl implements ExpenseCategoryService {

    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public PostResponse createExpenseCategory(RequestWrapper<ExpenseCategoryRequest> requestWrapper, UUID companyId) {
        ExpenseCategoryRequest request = requestWrapper.getData();

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        if (resolvedCompanyId == null) {
            throw new IllegalArgumentException("Company ID is required");
        }

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + resolvedCompanyId));

        String generatedCode = generateCategoryCode(resolvedCompanyId);

        if (expenseCategoryRepository.existsByCompanyIdAndCategoryNameAndIsDeletedFalse(resolvedCompanyId,
                request.getCategoryName())) {
            throw new DuplicateResourceException(
                    "Expense category with name " + request.getCategoryName() + " already exists in the company.");
        }

        ExpenseCategory category = ExpenseCategory.builder()
                .company(company)
                .categoryCode(generatedCode)
                .categoryName(request.getCategoryName())
                .description(request.getDescription())
                .isActive(request.getIsActive())
                .build();

        category = expenseCategoryRepository.save(category);
        log.info("Expense category created successfully with id: {}", category.getId());

        return PostResponse.builder().id(category.getId()).build();
    }

    @Override
    @Transactional
    public PostResponse updateExpenseCategory(UUID id, RequestWrapper<ExpenseCategoryRequest> requestWrapper) {
        ExpenseCategoryRequest request = requestWrapper.getData();

        ExpenseCategory category = expenseCategoryRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + id));

        UUID companyId = category.getCompany().getId();

        if (expenseCategoryRepository.existsByCompanyIdAndCategoryNameAndIsDeletedFalseAndIdNot(companyId,
                request.getCategoryName(), id)) {
            throw new DuplicateResourceException(
                    "Expense category with name " + request.getCategoryName() + " already exists in the company.");
        }

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());
        category.setIsActive(request.getIsActive());

        expenseCategoryRepository.save(category);
        log.info("Expense category updated successfully with id: {}", category.getId());

        return PostResponse.builder().id(category.getId()).build();
    }

    @Override
    @Transactional
    public PostResponse deleteExpenseCategory(UUID id) {
        ExpenseCategory category = expenseCategoryRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + id));

        category.setIsDeleted(true);
        category.setIsActive(false);
        category.setDeletedAt(LocalDateTime.now());
        // deletedBy will be set by CustomAuditListener or similarly handled if
        // configured.

        expenseCategoryRepository.save(category);
        log.info("Expense category softly deleted successfully with id: {}", category.getId());

        return PostResponse.builder().id(category.getId()).build();
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseCategoryResponse getExpenseCategoryById(UUID id) {
        ExpenseCategory category = expenseCategoryRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + id));

        return mapToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseCategoryResponseList getAllExpenseCategories(ExpenseCategoryFilterDto filter, Pageable pageable) {
        Page<ExpenseCategory> page = expenseCategoryRepository
                .findAll(ExpenseCategorySpecification.getFilterSpecification(filter), pageable);

        List<ExpenseCategoryResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ExpenseCategoryResponseList.builder()
                .content(responses)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .size(page.getSize())
                .number(page.getNumber())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }

    private ExpenseCategoryResponse mapToResponse(ExpenseCategory entity) {
        ExpenseCategoryResponse response = ExpenseCategoryResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompany() != null ? entity.getCompany().getId() : null)
                .categoryCode(entity.getCategoryCode())
                .categoryName(entity.getCategoryName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .build();
        return response;
    }

    private synchronized String generateCategoryCode(UUID companyId) {
        Optional<String> maxCodeOpt = expenseCategoryRepository.findMaxCategoryCodeByCompanyId(companyId);
        long nextVal = 1;
        if (maxCodeOpt.isPresent() && maxCodeOpt.get() != null && !maxCodeOpt.get().isBlank()) {
            String maxCode = maxCodeOpt.get().trim();
            try {
                if (maxCode.toUpperCase().startsWith("EC")) {
                    String numStr = maxCode.substring(2);
                    long currentMax = Long.parseLong(numStr);
                    nextVal = currentMax + 1;
                } else {
                    long currentMax = Long.parseLong(maxCode);
                    nextVal = currentMax + 1;
                }
            } catch (NumberFormatException e) {
                // Fallback sequence starting at 1 if non-numeric
            }
        }

        String generatedCode = String.format("EC%03d", nextVal);
        while (expenseCategoryRepository.existsByCompanyIdAndCategoryCode(companyId, generatedCode)) {
            nextVal++;
            generatedCode = String.format("EC%03d", nextVal);
        }
        return generatedCode;
    }
}
