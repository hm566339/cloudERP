package com.erp.crm.modules.account.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.account.dto.request.AccountCreateRequest;
import com.erp.crm.modules.account.dto.response.AccountResponse;
import com.erp.crm.modules.account.entity.CrmAccount;
import com.erp.crm.modules.account.entity.CrmAddress;
import com.erp.crm.modules.account.enums.AccountTier;
import com.erp.crm.modules.account.enums.AccountType;
import com.erp.crm.modules.account.enums.BusinessType;
import com.erp.crm.modules.account.mapper.AccountMapper;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmAddressRepository;
import com.erp.crm.modules.account.service.CrmAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmAccountServiceImpl implements CrmAccountService {

    private final CrmAccountRepository accountRepository;
    private final CrmAddressRepository addressRepository;
    private final AccountMapper accountMapper;

    @Override
    public AccountResponse createAccount(AccountCreateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Creating Account: {} for companyId: {}", request.getAccountName(), companyId);

        CrmAccount account = accountMapper.toEntity(request);
        account.setCompanyId(companyId);
        account.setAccountCode(generateAccountCode());

        if (account.getOwnerUserId() == null) {
            account.setOwnerUserId(TenantUtils.getCurrentUserId());
        }

        CrmAccount savedAccount = accountRepository.save(account);

        // Save Billing Address
        if (request.getBillingAddress() != null) {
            CrmAddress billing = accountMapper.toAddressEntity(request.getBillingAddress());
            billing.setCompanyId(companyId);
            billing.setEntityType("ACCOUNT");
            billing.setEntityId(savedAccount.getId());
            billing.setIsDefault(true);
            CrmAddress savedBilling = addressRepository.save(billing);
            savedAccount.setBillingAddressId(savedBilling.getId());
        }

        // Save Shipping Address
        if (request.getShippingAddress() != null) {
            CrmAddress shipping = accountMapper.toAddressEntity(request.getShippingAddress());
            shipping.setCompanyId(companyId);
            shipping.setEntityType("ACCOUNT");
            shipping.setEntityId(savedAccount.getId());
            CrmAddress savedShipping = addressRepository.save(shipping);
            savedAccount.setShippingAddressId(savedShipping.getId());
        }

        return accountMapper.toResponse(accountRepository.save(savedAccount));
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmAccount account = accountRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        return accountMapper.toResponse(account);
    }

    @Override
    public Page<AccountResponse> getAllAccounts(UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        Page<CrmAccount> page = accountRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable);
        if (page.isEmpty() && (pageable == null || pageable.getPageNumber() == 0)) {
            seedDefaultAccount(companyId);
            page = accountRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable);
        }
        return page.map(accountMapper::toResponse);
    }

    private void seedDefaultAccount(UUID companyId) {
        log.info("Auto-seeding default B2B Client Account for company [{}]", companyId);
        try {
            CrmAccount defaultAccount = CrmAccount.builder()
                    .accountCode(generateAccountCode())
                    .accountName("General B2B Clients & Direct Accounts")
                    .accountType(AccountType.CUSTOMER)
                    .industry("Corporate / Commercial")
                    .businessType(BusinessType.PVT_LTD)
                    .tier(AccountTier.TIER_2)
                    .isActive(true)
                    .build();
            defaultAccount.setCompanyId(companyId);
            accountRepository.save(defaultAccount);
        } catch (Exception e) {
            log.warn("Could not auto-seed default account: {}", e.getMessage());
        }
    }

    @Override
    public List<AccountResponse> searchAccounts(String query, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        List<CrmAccount> list = accountRepository.findByCompanyIdAndAccountNameContainingIgnoreCaseAndIsDeletedFalse(companyId, query);
        if (list.isEmpty() && accountRepository.countByCompanyIdAndIsDeletedFalse(companyId) == 0) {
            seedDefaultAccount(companyId);
            list = accountRepository.findByCompanyIdAndAccountNameContainingIgnoreCaseAndIsDeletedFalse(companyId, query);
        }
        return list.stream().map(accountMapper::toResponse).toList();
    }

    @Override
    public AccountResponse onboardToErp(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmAccount account = accountRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        // When integrating with account-main, the created customer id is assigned:
        if (account.getAccountMainCustomerId() == null) {
            account.setAccountMainCustomerId(UUID.randomUUID());
        }
        log.info("Onboarded CRM Account {} to ERP customer ID {}", account.getAccountCode(), account.getAccountMainCustomerId());
        return accountMapper.toResponse(accountRepository.save(account));
    }

    private String generateAccountCode() {
        return "ACC-" + LocalDate.now().getYear() + "-" + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999));
    }
}

