package com.erp.crm.modules.account.service.serviceImpl;

import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.PhoneUtils;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.account.dto.request.ContactCreateRequest;
import com.erp.crm.modules.account.dto.response.ContactResponse;
import com.erp.crm.modules.account.entity.CrmAccountContactRelation;
import com.erp.crm.modules.account.entity.CrmContact;
import com.erp.crm.modules.account.mapper.ContactMapper;
import com.erp.crm.modules.account.repository.CrmAccountContactRelationRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.account.service.CrmContactService;
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
public class CrmContactServiceImpl implements CrmContactService {

    private final CrmContactRepository contactRepository;
    private final CrmAccountContactRelationRepository relationRepository;
    private final ContactMapper contactMapper;

    @Override
    public ContactResponse createContact(ContactCreateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Creating Contact: {} for companyId: {}", request.getFirstName(), companyId);

        CrmContact contact = contactMapper.toEntity(request);
        contact.setCompanyId(companyId);
        contact.setContactCode(generateContactCode());

        String display = (request.getFirstName() + " " + (request.getLastName() != null ? request.getLastName() : "")).trim();
        contact.setDisplayName(display);

        if (request.getPhone() != null) {
            contact.setNormalizedPhone(PhoneUtils.normalizePhone(request.getPhone()));
        }
        if (request.getEmail() != null) {
            contact.setNormalizedEmail(request.getEmail().trim().toLowerCase());
        }
        if (contact.getOwnerUserId() == null) {
            contact.setOwnerUserId(TenantUtils.getCurrentUserId());
        }

        CrmContact savedContact = contactRepository.save(contact);

        if (request.getAccountId() != null) {
            CrmAccountContactRelation relation = CrmAccountContactRelation.builder()
                    .companyId(companyId)
                    .accountId(request.getAccountId())
                    .contactId(savedContact.getId())
                    .relationshipTitle(request.getDesignation() != null ? request.getDesignation() : "Primary Contact")
                    .isActive(true)
                    .build();
            relationRepository.save(relation);
        }

        return contactMapper.toResponse(savedContact);
    }

    @Override
    public ContactResponse updateContact(UUID id, ContactCreateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Updating Contact: {} (id: {}) for companyId: {}", request.getFirstName(), id, companyId);

        CrmContact contact = contactRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + id));

        contact.setFirstName(request.getFirstName());
        contact.setLastName(request.getLastName());
        String display = (request.getFirstName() + " " + (request.getLastName() != null ? request.getLastName() : "")).trim();
        contact.setDisplayName(display);
        contact.setSalutation(request.getSalutation());
        contact.setDesignation(request.getDesignation());
        contact.setDepartmentName(request.getDepartmentName());
        contact.setEmail(request.getEmail());
        if (request.getEmail() != null) {
            contact.setNormalizedEmail(request.getEmail().trim().toLowerCase());
        }
        contact.setPhone(request.getPhone());
        if (request.getPhone() != null) {
            contact.setNormalizedPhone(PhoneUtils.normalizePhone(request.getPhone()));
        }
        contact.setMobile(request.getMobile());
        if (request.getDecisionMakerRole() != null) {
            contact.setDecisionMakerRole(request.getDecisionMakerRole());
        }
        if (request.getIsPrimaryContact() != null) {
            contact.setIsPrimaryContact(request.getIsPrimaryContact());
        }
        if (request.getLinkedinUrl() != null) {
            contact.setLinkedinUrl(request.getLinkedinUrl());
        }
        if (request.getAccountId() != null) {
            contact.setAccountId(request.getAccountId());
        }

        CrmContact savedContact = contactRepository.save(contact);

        if (request.getAccountId() != null) {
            boolean exists = relationRepository.findByCompanyIdAndAccountIdAndContactId(companyId, request.getAccountId(), savedContact.getId()).isPresent();
            if (!exists) {
                CrmAccountContactRelation relation = CrmAccountContactRelation.builder()
                        .companyId(companyId)
                        .accountId(request.getAccountId())
                        .contactId(savedContact.getId())
                        .relationshipTitle(request.getDesignation() != null ? request.getDesignation() : "Contact")
                        .isActive(true)
                        .build();
                relationRepository.save(relation);
            }
        }

        return contactMapper.toResponse(savedContact);
    }

    @Override
    public void deleteContact(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        log.info("Deleting Contact: {} for companyId: {}", id, companyId);
        CrmContact contact = contactRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + id));
        contact.setIsDeleted(true);
        contactRepository.save(contact);
    }

    @Override
    @Transactional(readOnly = true)
    public ContactResponse getContactById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmContact contact = contactRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with id: " + id));
        return contactMapper.toResponse(contact);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContactResponse> getContactsByAccountId(UUID accountId, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return contactRepository.findByCompanyIdAndAccountIdAndIsDeletedFalse(companyId, accountId)
                .stream().map(contactMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContactResponse> getAllContacts(UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return contactRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable)
                .map(contactMapper::toResponse);
    }

    private String generateContactCode() {
        return "CON-" + LocalDate.now().getYear() + "-" + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999));
    }
}

