package com.erp.crm.modules.account.service;

import com.erp.crm.modules.account.dto.request.ContactCreateRequest;
import com.erp.crm.modules.account.dto.response.ContactResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CrmContactService {

    ContactResponse createContact(ContactCreateRequest request, UUID requestCompanyId);

    ContactResponse getContactById(UUID id, UUID requestCompanyId);

    List<ContactResponse> getContactsByAccountId(UUID accountId, UUID requestCompanyId);

    Page<ContactResponse> getAllContacts(UUID requestCompanyId, Pageable pageable);
}

