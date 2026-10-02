package com.erp.account.modules.accountgroup.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponse;
import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponseList;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupRequest;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.accountgroup.mapper.AccountGroupMapper;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupFilterDto;
import com.erp.account.modules.accountgroup.specification.AccountGroupSpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.accountcategory.repository.AccountCategoryRepository;
import com.erp.account.modules.accountgroup.repository.AccountGroupRepository;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.accountgroup.service.AccountGroupService;
import com.erp.account.modules.accountgroup.dto.response.*;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AccountGroupServiceImpl implements AccountGroupService {

        private final CompanyRepository companyRepository;
        private final AccountCategoryRepository accountCategoryRepository;
        private final AccountGroupMapper accountGroupMapper;
        private final AccountGroupRepository accountGroupRepository;
        private final GlJournalLineRepository glJournalLineRepository;

        @Override
        public PostResponse createAccountGroup(
                        RequestWrapper<AccountGroupRequest> requestWrapper,
                        UUID companyId) {

                AccountGroupRequest request = requestWrapper.unwrap();
                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

                log.info(
                                "Creating account group with name: {} for companyId: {}",
                                request.getName(),
                                resolvedCompanyId);

                Company company = companyRepository.findById(resolvedCompanyId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company not found"));

                AccountCategory accountCategory = accountCategoryRepository
                                .findById(request.getCategoryId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Account category not found"));
                validateCategoryCompany(accountCategory, resolvedCompanyId);

                // duplicate validation by name
                if (accountGroupRepository
                                .existsByNameIgnoreCaseAndCompanyIdAndIsDeletedFalse(
                                                request.getName(),
                                                resolvedCompanyId)) {

                        throw new ConflictException(
                                        "Account group already exists with name: "
                                                        + request.getName());
                }

                String groupCode;
                if (request.getCode() != null && !request.getCode().isBlank()) {
                        groupCode = request.getCode().trim();
                        if (accountGroupRepository.existsByCodeAndCompanyIdAndIsDeletedFalse(groupCode, resolvedCompanyId)) {
                                throw new ConflictException(
                                                "Account group already exists with code: " + groupCode);
                        }
                } else {
                        groupCode = generateAccountGroupCode(resolvedCompanyId);
                }

                AccountGroup parentGroup = null;

                if (request.getParentGroupId() != null) {

                        parentGroup = accountGroupRepository
                                        .findById(request.getParentGroupId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Parent group not found"));
                        validateParentGroup(parentGroup, resolvedCompanyId, null);
                }

                AccountGroup accountGroup = accountGroupMapper.toEntity(request);

                accountGroup.setCompany(company);
                accountGroup.setCategory(accountCategory);
                accountGroup.setParentGroup(parentGroup);
                accountGroup.setCode(groupCode);
                accountGroup.setIsDeleted(false);

                accountGroupRepository.save(accountGroup);

                return PostResponse.builder()
                                .message("Account group created successfully")
                                .build();
        }

        @Override
        public PostResponse updateAccountGroup(
                        UUID accountGroupId,
                        RequestWrapper<AccountGroupRequest> requestWrapper) {

                AccountGroupRequest request = requestWrapper.unwrap();

                log.info(
                                "Updating account group with id: {}",
                                accountGroupId);

                AccountGroup accountGroup = accountGroupRepository
                                .findById(accountGroupId)
                                .orElseThrow(() -> {

                                        log.error(
                                                        "Account group not found with id: {}",
                                                        accountGroupId);

                                        return new ResourceNotFoundException(
                                                        "Account group with id "
                                                                        + accountGroupId
                                                                        + " not found");
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID resolvedCompanyId = TenantUtils.getCurrentCompanyId();
                        if (!accountGroup.getCompany().getId().equals(resolvedCompanyId)) {
                                throw new ResourceNotFoundException("Account group not found");
                        }
                }

                AccountCategory accountCategory = accountCategoryRepository
                                .findById(request.getCategoryId())
                                .orElseThrow(() -> {

                                        log.error(
                                                        "Account category not found with id: {}",
                                                        request.getCategoryId());

                                        return new ResourceNotFoundException(
                                                        "Account category with id "
                                                                        + request.getCategoryId()
                                                                        + " not found");
                                });
                validateCategoryCompany(accountCategory, accountGroup.getCompany().getId());

                AccountGroup parentGroup = null;

                if (request.getParentGroupId() != null) {

                        parentGroup = accountGroupRepository
                                        .findById(request.getParentGroupId())
                                        .orElseThrow(() -> {

                                                log.error(
                                                                "Parent group not found with id: {}",
                                                                request.getParentGroupId());

                                                return new ResourceNotFoundException(
                                                                "Parent group with id "
                                                                                + request.getParentGroupId()
                                                                                + " not found");
                                        });

                        if (parentGroup.getId().equals(accountGroupId)) {

                                log.error(
                                                "Group cannot be parent of itself. accountGroupId: {}",
                                                accountGroupId);

                                throw new IllegalArgumentException(
                                                "Group cannot be parent of itself");
                        }
                        validateParentGroup(parentGroup, accountGroup.getCompany().getId(), accountGroupId);
                }

                String existingCode = accountGroup.getCode();
                // mapstruct update
                accountGroupMapper.updateEntity(
                                request,
                                accountGroup);

                accountGroup.setCategory(accountCategory);
                accountGroup.setParentGroup(parentGroup);

                if (request.getCode() == null || request.getCode().isBlank()) {
                        accountGroup.setCode(existingCode);
                } else {
                        accountGroup.setCode(request.getCode().trim());
                        accountGroupRepository
                                        .findByCodeAndCompanyIdAndIsDeletedFalse(accountGroup.getCode(),
                                                        accountGroup.getCompany().getId())
                                        .filter(ag -> !ag.getId().equals(accountGroupId))
                                        .ifPresent(ag -> {
                                                throw new ConflictException(
                                                                "Another account group exists with code: " + accountGroup.getCode());
                                        });
                }

                accountGroupRepository.save(accountGroup);

                log.info(
                                "Account group updated successfully with id: {}",
                                accountGroupId);

                return PostResponse.builder()
                                .message("Account group updated successfully")
                                .build();
        }

        @Override
        public PostResponse deleteAccountGroup(UUID accountGroupId) {

                log.info(
                                "Deleting account group with id: {}",
                                accountGroupId);
                AccountGroup accountGroup = accountGroupRepository.findById(accountGroupId)
                                .orElseThrow(() -> {
                                        log.error("Account group not found with id: {}", accountGroupId);
                                        return new ResourceNotFoundException("Account group not found");
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (!accountGroup.getCompany().getId().equals(companyId)) {
                                throw new ResourceNotFoundException("Account group not found");
                        }
                }

                if (accountGroupRepository.existsByParentGroupIdAndIsDeletedFalse(accountGroupId)) {
                        throw new ValidationException("Account group cannot be deleted because child groups exist");
                }

                accountGroup.setIsDeleted(true);
                accountGroupRepository.save(accountGroup);

                log.info(
                                "Account group deleted successfully with id: {}",
                                accountGroupId);

                return PostResponse.builder()
                                .message("Account group deleted successfully")
                                .build();
        }

        @Override
        public AccountGroupProfileResponse getAccountGroupById(UUID accountGroupId) {
                log.info(
                                "Fetching account group with id: {}",
                                accountGroupId);

                AccountGroup accountGroup = accountGroupRepository
                                .findById(accountGroupId)
                                .orElseThrow(() -> {

                                        log.error(
                                                        "Account group not found with id: {}",
                                                        accountGroupId);

                                        return new ResourceNotFoundException(
                                                        "Account group with id "
                                                                        + accountGroupId
                                                                        + " not found");
                                });

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (!accountGroup.getCompany().getId().equals(companyId)) {
                                throw new ResourceNotFoundException("Account group not found");
                        }
                }

                log.info(
                                "Account group fetched successfully with id: {}",
                                accountGroupId);

                AccountGroupProfileResponse profile = new AccountGroupProfileResponse();
                org.springframework.beans.BeanUtils.copyProperties(accountGroupMapper.toResponse(accountGroup), profile);
                
                enrichAccountGroupProfile(profile, accountGroup);
                
                return profile;
        }

        private void enrichAccountGroupProfile(AccountGroupProfileResponse profile, AccountGroup accountGroup) {
            UUID companyId = accountGroup.getCompany().getId();
            
            // 1. Category Details
            if (accountGroup.getCategory() != null) {
                CategoryDetailsDto categoryDto = CategoryDetailsDto.builder()
                    .categoryId(accountGroup.getCategory().getId())
                    .categoryName(accountGroup.getCategory().getName())
                    .categoryType(accountGroup.getCategory().getNature() != null ? accountGroup.getCategory().getNature().name() : null)
                    .description(null)
                    .build();
                profile.setCategoryDetails(categoryDto);
            }
            
            // 2. Parent Group
            if (accountGroup.getParentGroup() != null) {
                ParentGroupInfoDto parentDto = ParentGroupInfoDto.builder()
                    .parentGroupId(accountGroup.getParentGroup().getId())
                    .parentGroupCode(accountGroup.getParentGroup().getCode())
                    .parentGroupName(accountGroup.getParentGroup().getName())
                    .build();
                profile.setParentGroupInformation(parentDto);
            }
            
            // 3. Child Groups
            List<ChildGroupDto> childGroups = new ArrayList<>();
            if (accountGroup.getChildGroups() != null) {
                for (AccountGroup child : accountGroup.getChildGroups()) {
                    if (Boolean.TRUE.equals(child.getIsDeleted())) continue;
                    
                    int totalLedgers = child.getChartOfAccounts() != null ? 
                        (int) child.getChartOfAccounts().stream().filter(a -> !Boolean.TRUE.equals(a.getIsDeleted())).count() : 0;
                        
                    childGroups.add(ChildGroupDto.builder()
                        .groupId(child.getId())
                        .groupCode(child.getCode())
                        .groupName(child.getName())
                        .totalLedgers(totalLedgers)
                        .totalBalance(BigDecimal.ZERO) // Simplified: compute if necessary
                        .build());
                }
            }
            profile.setChildGroups(childGroups);
            
            // 4. Ledger Accounts & Balances
            List<LedgerAccountDto> ledgers = new ArrayList<>();
            BigDecimal totalGroupDebit = BigDecimal.ZERO;
            BigDecimal totalGroupCredit = BigDecimal.ZERO;
            BigDecimal totalGroupOpening = BigDecimal.ZERO;
            
            int activeLedgers = 0;
            int inactiveLedgers = 0;
            
            List<ChartOfAccount> groupAccounts = accountGroup.getChartOfAccounts() != null ? accountGroup.getChartOfAccounts() : Collections.emptyList();
            List<GlJournalLine> allRecentLines = new ArrayList<>();
            
            for (ChartOfAccount account : groupAccounts) {
                if (Boolean.TRUE.equals(account.getIsDeleted())) continue;
                
                if (Boolean.TRUE.equals(account.getIsActive())) {
                    activeLedgers++;
                } else {
                    inactiveLedgers++;
                }
                
                BigDecimal openingBal = account.getOpeningBalance() != null ? account.getOpeningBalance() : BigDecimal.ZERO;
                totalGroupOpening = totalGroupOpening.add(openingBal);
                
                BigDecimal totalDebit = glJournalLineRepository.getTotalPostedDebitForAccount(companyId, account.getId());
                BigDecimal totalCredit = glJournalLineRepository.getTotalCreditForAccount(companyId, account.getId());
                
                if (totalDebit == null) totalDebit = BigDecimal.ZERO;
                if (totalCredit == null) totalCredit = BigDecimal.ZERO;
                
                totalGroupDebit = totalGroupDebit.add(totalDebit);
                totalGroupCredit = totalGroupCredit.add(totalCredit);
                
                // Assuming normal balance is Debit (Assets/Expenses), just doing Debits - Credits for simplified view. 
                // A true system flips this based on account type, but for DTO a standard formula is usually sufficient.
                BigDecimal currentBal = openingBal.add(totalDebit).subtract(totalCredit);
                
                ledgers.add(LedgerAccountDto.builder()
                    .ledgerId(account.getId())
                    .ledgerCode(account.getAccountCode())
                    .ledgerName(account.getAccountName())
                    .openingBalance(openingBal)
                    .currentBalance(currentBal)
                    .closingBalance(currentBal)
                    .status(Boolean.TRUE.equals(account.getIsActive()) ? "ACTIVE" : "INACTIVE")
                    .build());
                    
                // Fetch recent lines for this account
                Page<GlJournalLine> recentLines = glJournalLineRepository.getAccountLedger(companyId, account.getId(), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "journalEntry.voucherDate")));
                allRecentLines.addAll(recentLines.getContent());
            }
            profile.setLedgerAccounts(ledgers);
            
            // 5. Group Balance Summary
            BigDecimal netBalance = totalGroupOpening.add(totalGroupDebit).subtract(totalGroupCredit);
            profile.setGroupBalanceSummary(GroupBalanceSummaryDto.builder()
                .totalDebit(totalGroupDebit)
                .totalCredit(totalGroupCredit)
                .netBalance(netBalance)
                .openingBalance(totalGroupOpening)
                .closingBalance(netBalance)
                .build());
                
            // 6. Recent Transactions
            allRecentLines.sort(Comparator.comparing((GlJournalLine l) -> l.getJournalEntry().getVoucherDate()).reversed());
            List<GlJournalLine> topLines = allRecentLines.stream().limit(20).collect(Collectors.toList());
            
            List<GroupTransactionDto> txDtos = new ArrayList<>();
            List<GroupJournalEntryDto> jeDtos = new ArrayList<>();
            
            for (GlJournalLine line : topLines) {
                txDtos.add(GroupTransactionDto.builder()
                    .transactionId(line.getId())
                    .transactionDate(line.getJournalEntry().getVoucherDate())
                    .voucherNumber(line.getJournalEntry().getVoucherNo())
                    .voucherType(line.getJournalEntry().getSourceModule() != null ? line.getJournalEntry().getSourceModule().name() : null)
                    .ledgerName(line.getAccount().getAccountName())
                    .debit(line.getDebitAmount())
                    .credit(line.getCreditAmount())
                    .remarks(line.getLineDescription())
                    .build());
                    
                // For simplified grouping in DTO
                if (jeDtos.stream().noneMatch(j -> j.getJournalId().equals(line.getJournalEntry().getId()))) {
                    jeDtos.add(GroupJournalEntryDto.builder()
                        .journalId(line.getJournalEntry().getId())
                        .voucherNumber(line.getJournalEntry().getVoucherNo())
                        .voucherType(line.getJournalEntry().getSourceModule() != null ? line.getJournalEntry().getSourceModule().name() : null)
                        .transactionDate(line.getJournalEntry().getVoucherDate())
                        .debit(line.getJournalEntry().getTotalDebit())
                        .credit(line.getJournalEntry().getTotalCredit())
                        .build());
                }
            }
            profile.setRecentTransactions(txDtos);
            profile.setJournalEntries(jeDtos);
            
            // 7. Statistics
            profile.setStatistics(GroupStatisticsDto.builder()
                .totalChildGroups(childGroups.size())
                .totalLedgerAccounts(ledgers.size())
                .totalActiveLedgers(activeLedgers)
                .totalInactiveLedgers(inactiveLedgers)
                .totalDebitAmount(totalGroupDebit)
                .totalCreditAmount(totalGroupCredit)
                .netBalance(netBalance)
                .build());
                
            // 8. Hierarchy
            List<String> childNames = childGroups.stream().map(ChildGroupDto::getGroupName).collect(Collectors.toList());
            String rootGroup = accountGroup.getName();
            int depth = 0;
            AccountGroup curr = accountGroup.getParentGroup();
            while (curr != null) {
                rootGroup = curr.getName();
                depth++;
                curr = curr.getParentGroup();
            }
            profile.setHierarchy(GroupHierarchyDto.builder()
                .rootGroup(rootGroup)
                .parentGroup(accountGroup.getParentGroup() != null ? accountGroup.getParentGroup().getName() : null)
                .currentGroup(accountGroup.getName())
                .childGroups(childNames)
                .levelDepth(depth)
                .build());
                
            // 9. Audit Info
            profile.setAuditInformation(GroupAuditInfoDto.builder()
                .createdBy(accountGroup.getCreatedBy())
                .createdAt(accountGroup.getCreatedAt())
                .updatedBy(accountGroup.getUpdatedBy())
                .updatedAt(accountGroup.getUpdatedAt())
                .build());
        }

        @Override
        public AccountGroupResponseList getAllAccountGroups(
                        AccountGroupFilterDto filter,
                        Pageable pageable) {

                UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());


                log.info("Fetching all account groups for companyId: {}", resolvedCompanyId);

                Specification<AccountGroup> spec = AccountGroupSpecification.getFilterSpecification(filter, resolvedCompanyId);

                Page<AccountGroup> accountGroupPage = accountGroupRepository.findAll(spec, pageable);

                List<AccountGroupResponse> accountGroupResponses = accountGroupPage.getContent()
                                .stream()
                                .map(accountGroupMapper::toResponse)
                                .collect(Collectors.toList());

                PaginationResponse paginationResponse = PaginationResponse.builder()
                                .page(accountGroupPage.getNumber() + 1)
                                .size(accountGroupPage.getSize())
                                .totalPages(accountGroupPage.getTotalPages())
                                .totalElements(accountGroupPage.getTotalElements())
                                .first(accountGroupPage.isFirst())
                                .last(accountGroupPage.isLast())
                                .build();

                log.info(
                                "Account groups fetched successfully for companyId: {}, total records: {}",
                                resolvedCompanyId,
                                accountGroupPage.getTotalElements());

                return AccountGroupResponseList.builder()
                                .data(accountGroupResponses)
                                .paginationResponse(paginationResponse)
                                .build();
        }

        @Override
        public PostResponse restoreAccountGroup(UUID accountGroupId) {
                log.info("Restoring account group with id: {}", accountGroupId);
                AccountGroup accountGroup = accountGroupRepository.findById(accountGroupId)
                                .orElseThrow(() -> new ResourceNotFoundException("Account group not found"));

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (!accountGroup.getCompany().getId().equals(companyId)) {
                                throw new ResourceNotFoundException("Account group not found");
                        }
                }

                if (accountGroup.getParentGroup() != null) {
                        validateParentGroup(accountGroup.getParentGroup(), accountGroup.getCompany().getId(),
                                        accountGroupId);
                }

                accountGroup.setIsDeleted(false);
                accountGroupRepository.save(accountGroup);

                return PostResponse.builder()
                                .message("Account group restored successfully")
                                .build();
        }

        private void validateCategoryCompany(AccountCategory accountCategory, UUID companyId) {
                if (!accountCategory.getCompany().getId().equals(companyId)) {
                        throw new ValidationException("Account category does not belong to the tenant company");
                }
                if (Boolean.TRUE.equals(accountCategory.getIsDeleted())) {
                        throw new ValidationException("Deleted account category cannot be used");
                }
        }

        private void validateParentGroup(AccountGroup parentGroup, UUID companyId, UUID childGroupId) {
                if (!parentGroup.getCompany().getId().equals(companyId)) {
                        throw new ValidationException("Parent group must belong to the same company");
                }
                if (Boolean.TRUE.equals(parentGroup.getIsDeleted())) {
                        throw new ValidationException("Deleted parent group cannot be used");
                }
                validateNoCyclicParent(parentGroup, childGroupId);
        }

        private void validateNoCyclicParent(AccountGroup parentGroup, UUID childGroupId) {
                validateNoCyclicParent(parentGroup, childGroupId, new HashSet<>());
        }

        private void validateNoCyclicParent(AccountGroup parentGroup, UUID childGroupId, Set<UUID> visited) {
                if (parentGroup == null) {
                        return;
                }
                if (childGroupId != null && parentGroup.getId() != null && parentGroup.getId().equals(childGroupId)) {
                        throw new ValidationException("Cyclic account group hierarchy is not allowed");
                }
                if (!visited.add(parentGroup.getId())) {
                        throw new ValidationException("Cyclic account group hierarchy is not allowed");
                }
                if (parentGroup.getParentGroup() != null) {
                        validateNoCyclicParent(parentGroup.getParentGroup(), childGroupId, visited);
                }
        }

        private synchronized String generateAccountGroupCode(UUID companyId) {
                Optional<String> maxCodeOpt = accountGroupRepository.findMaxCodeByCompanyId(companyId);
                long nextVal = 1000;
                if (maxCodeOpt.isPresent() && maxCodeOpt.get() != null && !maxCodeOpt.get().isBlank()) {
                        String maxCode = maxCodeOpt.get().trim();
                        try {
                                long currentMax = Long.parseLong(maxCode);
                                if (currentMax >= 1000) {
                                        nextVal = currentMax + 1;
                                }
                        } catch (NumberFormatException e) {
                                // If max code was non-numeric, default to 1000
                        }
                }
                String generatedCode = String.valueOf(nextVal);
                while (accountGroupRepository.existsByCodeAndCompanyIdAndIsDeletedFalse(generatedCode, companyId)) {
                        nextVal++;
                        generatedCode = String.valueOf(nextVal);
                }
                return generatedCode;
        }
}
