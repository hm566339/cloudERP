package com.erp.account.modules.quotation.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.account.modules.quotation.dto.request.QuotationFilterDto;
import com.erp.account.modules.quotation.dto.request.QuotationItemRequest;
import com.erp.account.modules.quotation.dto.request.QuotationUpdateRequest;
import com.erp.account.modules.quotation.dto.response.QuotationResponse;
import com.erp.account.modules.quotation.dto.response.SendQuotationEmailResponse;
import com.erp.account.modules.quotation.dto.response.SendQuotationEmailResponse.SendQuotationEmailResponseBuilder;
import com.erp.account.modules.quotation.dto.response.profile.*;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.exception.QuotationNotFoundException;
import com.erp.account.modules.quotation.mapper.QuotationMapper;
import com.erp.account.modules.quotation.repository.QuotationItemRepository;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.QuotationService;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.proformainvoice.dto.request.PIConversionRequest;
import com.erp.account.modules.proformainvoice.service.ProformaInvoiceService;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.settings.entity.PaymentTerm;
import com.erp.account.modules.settings.entity.TermsCondition;
import com.erp.account.modules.settings.repository.PaymentTermRepository;
import com.erp.account.modules.settings.repository.TermsConditionRepository;
import com.erp.account.email.service.QuotationEmailService;
import com.erp.account.modules.quotation.service.QuotationPdfService;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationServiceImpl implements QuotationService {

    private final QuotationRepository quotationRepository;
    private final QuotationItemRepository quotationItemRepository;
    private final QuotationMapper quotationMapper;
    private final CompanyRepository companyRepository;
    private final CustomerRepository customerRepository;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final ProformaInvoiceService proformaInvoiceService;
    private final PaymentTermRepository paymentTermRepository;
    private final TermsConditionRepository termsConditionRepository;
    private final com.erp.account.modules.settings.repository.DeliveryTermRepository deliveryTermRepository;
    private final com.erp.account.modules.settings.repository.WarrantyTermRepository warrantyTermRepository;
    private final QuotationEmailService quotationEmailService;
    private final QuotationPdfService quotationPdfService;
    private final WorkflowClient workflowClient;

    @Override
    @Transactional
    public QuotationResponse createQuotation(UUID companyId, QuotationCreateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Creating quotation for company: {}", resolvedCompanyId);

        validateDates(request.getQuotationDate(), request.getValidUntil());

        if (request.getQuotationNumber() == null || request.getQuotationNumber().trim().isEmpty()) {
            request.setQuotationNumber(
                    voucherSequenceService.generateNextQuotationNumber(resolvedCompanyId, request.getQuotationDate()));
        }

        if (quotationRepository.existsByQuotationNumberAndCompanyIdAndIsDeletedFalse(request.getQuotationNumber(),
                resolvedCompanyId)) {
            throw new BadRequestException("Quotation number already exists: " + request.getQuotationNumber());
        }

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Company not found"));
        Customer customer = customerRepository
                .findByIdAndCompanyIdAndIsDeletedFalse(request.getCustomerId(), resolvedCompanyId)
                .orElseThrow(() -> new BadRequestException("Customer not found or doesn't belong to company"));

        resolveSettingsForCreate(request, resolvedCompanyId);

        Quotation quotation = quotationMapper.toEntity(request);
        quotation.setCompanyId(resolvedCompanyId);
        quotation.setCompany(company);
        quotation.setCustomerId(customer.getId());
        quotation.setCustomer(customer);
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setCreatedBy(TenantUtils.getCurrentUserId());

        processQuotationItems(quotation, request.getItems(), resolvedCompanyId);
        calculateQuotationTotals(quotation);

        Quotation saved = quotationRepository.save(quotation);
        log.info("Quotation created successfully: {} with ID: {}", saved.getQuotationNumber(), saved.getId());

        return quotationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public QuotationResponse updateQuotation(UUID companyId, UUID id, QuotationUpdateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Updating quotation ID: {} for company: {}", id, resolvedCompanyId);

        validateDates(request.getQuotationDate(), request.getValidUntil());

        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));

        if (!quotation.isEditable()) {
            throw new BadRequestException(
                    "Quotation cannot be updated in its current status: " + quotation.getStatus());
        }

        if (request.getQuotationNumber() != null
                && !request.getQuotationNumber().equals(quotation.getQuotationNumber())) {
            if (quotationRepository.existsByQuotationNumberAndCompanyIdAndIdNotAndIsDeletedFalse(
                    request.getQuotationNumber(), resolvedCompanyId, id)) {
                throw new BadRequestException("Quotation number already exists: " + request.getQuotationNumber());
            }
        }

        if (!request.getCustomerId().equals(quotation.getCustomerId())) {
            Customer customer = customerRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getCustomerId(), resolvedCompanyId)
                    .orElseThrow(() -> new BadRequestException("Customer not found or doesn't belong to company"));
            quotation.setCustomerId(customer.getId());
            quotation.setCustomer(customer);
        }

        resolveSettingsForUpdate(request, resolvedCompanyId);

        quotationMapper.updateEntity(quotation, request);
        quotation.setUpdatedBy(TenantUtils.getCurrentUserId());

        updateQuotationItems(quotation, request.getItems(), resolvedCompanyId);
        calculateQuotationTotals(quotation);

        Quotation saved = quotationRepository.save(quotation);
        return quotationMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationProfileResponse getQuotationById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));
        return buildQuotationProfileResponse(quotation);
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationProfileResponse getQuotationByNumber(UUID companyId, String quotationNumber) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository
                .findByQuotationNumberAndCompanyIdAndIsDeletedFalse(quotationNumber, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(quotationNumber));
        return buildQuotationProfileResponse(quotation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuotationResponse> getAllQuotations(UUID companyId, QuotationFilterDto filter, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Specification<Quotation> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("companyId"), resolvedCompanyId));
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (filter != null) {
                if (filter.getSearchKey() != null && !filter.getSearchKey().trim().isEmpty()) {
                    String sk = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                    jakarta.persistence.criteria.Join<Object, Object> customerJoin = root.join("customer",
                            jakarta.persistence.criteria.JoinType.LEFT);
                    predicates.add(cb.or(
                            cb.like(cb.lower(root.get("quotationNumber")), sk),
                            cb.like(cb.lower(customerJoin.get("customerName")), sk)));
                }
                if (filter.getQuotationNumber() != null && !filter.getQuotationNumber().trim().isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("quotationNumber")),
                            "%" + filter.getQuotationNumber().trim().toLowerCase() + "%"));
                }
                if (filter.getCustomerId() != null) {
                    predicates.add(cb.equal(root.get("customerId"), filter.getCustomerId()));
                }
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
                if (filter.getStartDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("quotationDate"), filter.getStartDate()));
                }
                if (filter.getEndDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("quotationDate"), filter.getEndDate()));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return quotationRepository.findAll(spec, pageable).map(quotationMapper::toResponse);
    }

    @Override
    @Transactional
    public void deleteQuotation(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));

        if (quotation.getStatus() != QuotationStatus.DRAFT) {
            throw new BadRequestException(
                    "Only DRAFT quotations can be deleted. Current status: " + quotation.getStatus());
        }

        quotation.setIsDeleted(true);
        quotation.setDeletedAt(LocalDateTime.now());
        quotationRepository.save(quotation);
    }

    @Override
    @Transactional
    public QuotationResponse changeStatus(UUID companyId, UUID id, QuotationStatus newStatus) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));

        QuotationStatus current = quotation.getStatus();
        boolean validTransition = false;

        switch (current) {
            case DRAFT:
                if (newStatus == QuotationStatus.PENDING_APPROVAL || newStatus == QuotationStatus.APPROVED
                        || newStatus == QuotationStatus.SENT || newStatus == QuotationStatus.CANCELLED
                        || newStatus == QuotationStatus.EXPIRED) {
                    validTransition = true;
                }
                break;
            case PENDING_APPROVAL:
                if (newStatus == QuotationStatus.APPROVED || newStatus == QuotationStatus.REJECTED
                        || newStatus == QuotationStatus.CHANGES_REQUESTED || newStatus == QuotationStatus.CUSTOMER_ACCEPTED
                        || newStatus == QuotationStatus.ACCEPTED || newStatus == QuotationStatus.CANCELLED) {
                    validTransition = true;
                }
                break;
            case CHANGES_REQUESTED:
                if (newStatus == QuotationStatus.PENDING_APPROVAL || newStatus == QuotationStatus.DRAFT
                        || newStatus == QuotationStatus.CANCELLED) {
                    validTransition = true;
                }
                break;
            case APPROVED:
                if (newStatus == QuotationStatus.SENT || newStatus == QuotationStatus.CUSTOMER_ACCEPTED
                        || newStatus == QuotationStatus.ACCEPTED || newStatus == QuotationStatus.REJECTED
                        || newStatus == QuotationStatus.CONVERTED || newStatus == QuotationStatus.CANCELLED) {
                    validTransition = true;
                }
                break;
            case SENT:
                if (newStatus == QuotationStatus.CUSTOMER_ACCEPTED || newStatus == QuotationStatus.ACCEPTED
                        || newStatus == QuotationStatus.REJECTED || newStatus == QuotationStatus.EXPIRED
                        || newStatus == QuotationStatus.CONVERTED || newStatus == QuotationStatus.CANCELLED) {
                    validTransition = true;
                }
                break;
            case CUSTOMER_ACCEPTED:
            case ACCEPTED:
                if (newStatus == QuotationStatus.CONVERTED || newStatus == QuotationStatus.CANCELLED) {
                    validTransition = true;
                }
                break;
            case CONVERTED:
            case REJECTED:
            case EXPIRED:
            case CANCELLED:
                break; // Terminal states do not allow transitions
        }

        if (!validTransition) {
            throw new BadRequestException("Invalid status transition from " + current + " to " + newStatus);
        }

        quotation.setStatus(newStatus);
        quotation.setUpdatedBy(TenantUtils.getCurrentUserId());
        Quotation saved = quotationRepository.save(quotation);
        return quotationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public QuotationResponse approveQuotation(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));

        if (quotation.getStatus() != QuotationStatus.DRAFT && quotation.getStatus() != QuotationStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only DRAFT or PENDING_APPROVAL quotations can be approved");
        }

        // Prevent bypassing active pending workflow
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "QUOTATION", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Quotation cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped or completed for quotation {}: {}", id, e.getMessage());
        }

        quotation.setStatus(QuotationStatus.APPROVED);
        quotation.setApprovedBy(TenantUtils.getCurrentUserId());
        quotation.setApprovedAt(LocalDateTime.now());
        quotation.setUpdatedBy(TenantUtils.getCurrentUserId());

        Quotation saved = quotationRepository.save(quotation);
        return quotationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public QuotationResponse submitForApproval(UUID companyId, UUID id, String comments) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));

        if (quotation.getStatus() != QuotationStatus.DRAFT && quotation.getStatus() != QuotationStatus.CHANGES_REQUESTED) {
            throw new BadRequestException("Only DRAFT or CHANGES_REQUESTED quotations can be submitted for approval. Current status: " + quotation.getStatus());
        }

        // Prevent duplicate workflow submission
        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "QUOTATION", quotation.getId());
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BadRequestException("Quotation is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for quotation {}", id);
        }

        UUID custId = quotation.getCustomer() != null ? quotation.getCustomer().getId() : null;
        WorkflowTransactionDto tx = workflowClient.submitWorkflow(
                resolvedCompanyId,
                "QUOTATION",
                quotation.getId(),
                quotation.getQuotationNumber(),
                comments != null ? comments : "Submitted quotation for approval",
                quotation.getTotalAmount(),
                custId,
                Map.of("amount", quotation.getTotalAmount() != null ? quotation.getTotalAmount() : BigDecimal.ZERO)
        );

        if (tx != null && "APPROVED".equalsIgnoreCase(tx.getStatus())) {
            quotation.setStatus(QuotationStatus.APPROVED);
            log.info("Quotation {} auto-approved by workflow engine, status updated to APPROVED", quotation.getQuotationNumber());
        } else {
            quotation.setStatus(QuotationStatus.PENDING_APPROVAL);
            log.info("Quotation {} submitted for approval to workflow-service, status updated to PENDING_APPROVAL", quotation.getQuotationNumber());
        }
        Quotation saved = quotationRepository.save(quotation);
        return quotationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public QuotationResponse sendQuotation(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(resolvedCompanyId, "QUOTATION", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BadRequestException("Quotation cannot be sent while workflow approval is pending.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for send quotation {}: {}", id, e.getMessage());
        }

        QuotationResponse response = changeStatus(companyId, id, QuotationStatus.SENT);

        try {
            Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                    .orElse(null);

            if (quotation != null && quotation.getCustomer() != null) {
                String email = quotation.getCustomer().getEmail();
                if (email != null && !email.trim().isEmpty()) {
                    byte[] pdfBytes = quotationPdfService.generateQuotationPdf(id, resolvedCompanyId);

                    quotationEmailService.sendQuotationEmail(quotation, pdfBytes);
                } else {
                    log.info("Skipped sending quotation email for quotation {} because customer email is empty", id);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send quotation email for quotation {}", id, e);
        }

        return response;
    }

    @Override
    @Transactional
    public QuotationResponse acceptQuotation(UUID companyId, UUID id) {
        return changeStatus(companyId, id, QuotationStatus.CUSTOMER_ACCEPTED);
    }

    @Override
    @Transactional
    public QuotationResponse rejectQuotation(UUID companyId, UUID id) {
        return changeStatus(companyId, id, QuotationStatus.REJECTED);
    }

    @Override
    @Transactional
    public QuotationResponse cancelQuotation(UUID companyId, UUID id) {
        return changeStatus(companyId, id, QuotationStatus.CANCELLED);
    }

    @Override
    @Transactional
    public SendQuotationEmailResponse sendQuotationEmail(UUID companyId,
            UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        Quotation quotation = quotationRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new QuotationNotFoundException(id));

        if (quotation.getCustomer() == null || quotation.getCustomer().getEmail() == null
                || quotation.getCustomer().getEmail().trim().isEmpty()) {
            throw new BadRequestException("Customer email address is not available for this quotation.");
        }

        SendQuotationEmailResponseBuilder responseBuilder = SendQuotationEmailResponse
                .builder()
                .quotationId(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .recipientEmail(quotation.getCustomer().getEmail());

        try {
            byte[] pdfBytes = quotationPdfService.generateQuotationPdf(id, resolvedCompanyId);
            quotationEmailService.sendQuotationEmail(quotation, pdfBytes);
            responseBuilder.emailStatus("SENT");
            log.info("Successfully resent quotation email for quotation {}", id);
        } catch (Exception e) {
            log.error("Failed to resend quotation email for quotation {}", id, e);
            responseBuilder.emailStatus("FAILED");
        }

        return responseBuilder.build();
    }

    private void validateDates(LocalDate quotationDate, LocalDate validUntil) {
        if (validUntil.isBefore(quotationDate)) {
            throw new BadRequestException("Valid until date cannot be before quotation date");
        }
    }

    private void resolveSettingsForCreate(QuotationCreateRequest request, UUID companyId) {
        if (request.getPaymentTermId() != null) {
            PaymentTerm pt = paymentTermRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getPaymentTermId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid payment term ID"));
            if (!pt.getIsActive())
                throw new BadRequestException("Selected payment term is inactive");
            request.setPaymentTerms(pt.getDescription());
        } else if (request.getPaymentTerms() == null) {
            paymentTermRepository
                    .findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(companyId,
                            SalesDocumentType.QUOTATION)
                    .ifPresent(pt -> {
                        request.setPaymentTermId(pt.getId());
                        request.setPaymentTerms(pt.getDescription());
                    });
        }

        if (request.getDeliveryTermId() != null) {
            com.erp.account.modules.settings.entity.DeliveryTerm dt = deliveryTermRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getDeliveryTermId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid delivery term ID"));
            if (!dt.getIsActive())
                throw new BadRequestException("Selected delivery term is inactive");
            request.setDeliveryTerms(dt.getDescription());
        } else if (request.getDeliveryTerms() == null) {
            deliveryTermRepository
                    .findDefaultByCompanyIdAndDocumentType(companyId,
                            SalesDocumentType.QUOTATION)
                    .ifPresent(dt -> {
                        request.setDeliveryTermId(dt.getId());
                        request.setDeliveryTerms(dt.getDescription());
                    });
        }

        if (request.getWarrantyTermId() != null) {
            com.erp.account.modules.settings.entity.WarrantyTerm wt = warrantyTermRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getWarrantyTermId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid warranty term ID"));
            if (!wt.getIsActive())
                throw new BadRequestException("Selected warranty term is inactive");
            request.setWarrantyTerms(wt.getDescription());
        } else if (request.getWarrantyTerms() == null) {
            warrantyTermRepository
                    .findDefaultByCompanyIdAndDocumentType(companyId,
                            SalesDocumentType.QUOTATION)
                    .ifPresent(wt -> {
                        request.setWarrantyTermId(wt.getId());
                        request.setWarrantyTerms(wt.getDescription());
                    });
        }

        if (request.getTermsConditionId() != null) {
            TermsCondition tc = termsConditionRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getTermsConditionId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid terms & condition ID"));
            if (!tc.getIsActive())
                throw new BadRequestException("Selected terms & condition is inactive");
            request.setTermsAndConditions(tc.getContent());
        } else if (request.getTermsAndConditions() == null) {
            termsConditionRepository
                    .findByCompanyIdAndDocumentTypeAndIsDefaultTrueAndIsDeletedFalse(companyId,
                            SalesDocumentType.QUOTATION)
                    .ifPresent(tc -> {
                        request.setTermsConditionId(tc.getId());
                        request.setTermsAndConditions(tc.getContent());
                    });
        }
    }

    private void resolveSettingsForUpdate(QuotationUpdateRequest request, UUID companyId) {
        if (request.getPaymentTermId() != null) {
            PaymentTerm pt = paymentTermRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getPaymentTermId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid payment term ID"));
            if (!pt.getIsActive())
                throw new BadRequestException("Selected payment term is inactive");
            request.setPaymentTerms(pt.getDescription());
        }

        if (request.getDeliveryTermId() != null) {
            com.erp.account.modules.settings.entity.DeliveryTerm dt = deliveryTermRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getDeliveryTermId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid delivery term ID"));
            if (!dt.getIsActive())
                throw new BadRequestException("Selected delivery term is inactive");
            request.setDeliveryTerms(dt.getDescription());
        }

        if (request.getWarrantyTermId() != null) {
            com.erp.account.modules.settings.entity.WarrantyTerm wt = warrantyTermRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getWarrantyTermId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid warranty term ID"));
            if (!wt.getIsActive())
                throw new BadRequestException("Selected warranty term is inactive");
            request.setWarrantyTerms(wt.getDescription());
        }

        if (request.getTermsConditionId() != null) {
            TermsCondition tc = termsConditionRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getTermsConditionId(), companyId)
                    .orElseThrow(() -> new BadRequestException("Invalid terms & condition ID"));
            if (!tc.getIsActive())
                throw new BadRequestException("Selected terms & condition is inactive");
            request.setTermsAndConditions(tc.getContent());
        }
    }

    private void processQuotationItems(Quotation quotation, List<QuotationItemRequest> itemRequests, UUID companyId) {
        for (QuotationItemRequest itemReq : itemRequests) {
            QuotationItem item = new QuotationItem();
            item.setCompanyId(companyId);
            item.setCompany(quotation.getCompany());
            mapItemDetails(item, itemReq, companyId, quotation.getPlaceOfSupplyStateCode());
            item.setCreatedBy(TenantUtils.getCurrentUserId());
            quotation.addQuotationItem(item);
        }
    }

    private void updateQuotationItems(Quotation quotation, List<QuotationItemRequest> itemRequests, UUID companyId) {
        quotation.getQuotationItems().clear();
        for (QuotationItemRequest itemReq : itemRequests) {
            QuotationItem item = new QuotationItem();
            item.setCompanyId(companyId);
            item.setCompany(quotation.getCompany());
            mapItemDetails(item, itemReq, companyId, quotation.getPlaceOfSupplyStateCode());
            item.setCreatedBy(TenantUtils.getCurrentUserId());
            quotation.addQuotationItem(item);
        }
    }

    private void mapItemDetails(QuotationItem item, QuotationItemRequest req, UUID companyId,
            String placeOfSupplyStateCode) {
        item.setItemId(req.getItemId());
        item.setItemName(req.getItemName());
        item.setDescription(req.getDescription());
        item.setQuantity(req.getQuantity());
        item.setUnit(req.getUnit());
        item.setUnitPrice(req.getUnitPrice());
        item.setDiscountPercent(req.getDiscountPercent());
        item.setNotes(req.getNotes());

        HsnSacMaster hsnSac = hsnSacMasterRepository.findByCodeAndIsDeletedFalse(req.getHsnSacCode())
                .orElseThrow(() -> new BadRequestException("Invalid HSN/SAC code: " + req.getHsnSacCode()));
        item.setHsnSacMaster(hsnSac);

        item.calculateLineAmount();
        calculateItemTax(item, hsnSac, companyId, placeOfSupplyStateCode);
        item.calculateTotalAmount();
    }

    private void calculateItemTax(QuotationItem item, HsnSacMaster hsnSac, UUID companyId,
            String placeOfSupplyStateCode) {
        Company company = companyRepository.findById(companyId).orElseThrow();
        String companyStateCode = "";
        if (company.getGstin() != null && company.getGstin().length() >= 2) {
            companyStateCode = company.getGstin().substring(0, 2);
        }

        BigDecimal cgstRate = BigDecimal.ZERO;
        BigDecimal sgstRate = BigDecimal.ZERO;
        BigDecimal igstRate = BigDecimal.ZERO;
        BigDecimal cessRate = BigDecimal.ZERO;

        BigDecimal cgstAmount = BigDecimal.ZERO;
        BigDecimal sgstAmount = BigDecimal.ZERO;
        BigDecimal igstAmount = BigDecimal.ZERO;
        BigDecimal cessAmount = BigDecimal.ZERO;

        BigDecimal taxableAmount = item.getTaxableAmount() != null ? item.getTaxableAmount() : BigDecimal.ZERO;

        if (hsnSac.getGstSlab() != null) {
            if (companyStateCode != null && companyStateCode.equals(placeOfSupplyStateCode)) {
                // Intra-state
                cgstRate = hsnSac.getGstSlab().getCgstRate();
                sgstRate = hsnSac.getGstSlab().getSgstRate();
                cgstAmount = calculatePercentage(taxableAmount, cgstRate);
                sgstAmount = calculatePercentage(taxableAmount, sgstRate);
            } else {
                // Inter-state
                igstRate = hsnSac.getGstSlab().getIgstRate();
                igstAmount = calculatePercentage(taxableAmount, igstRate);
            }
            cessRate = hsnSac.getGstSlab().getCessRate();
            cessAmount = calculatePercentage(taxableAmount, cessRate);
        }

        item.setCgstRate(cgstRate);
        item.setCgstAmount(cgstAmount);
        item.setSgstRate(sgstRate);
        item.setSgstAmount(sgstAmount);
        item.setIgstRate(igstRate);
        item.setIgstAmount(igstAmount);
        item.setCessRate(cessRate);
        item.setCessAmount(cessAmount);

        item.calculateTaxAmount();
    }

    private BigDecimal calculatePercentage(BigDecimal amount, BigDecimal percentage) {
        if (amount == null || percentage == null || percentage.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(percentage).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
    }

    private void calculateQuotationTotals(Quotation quotation) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;

        for (QuotationItem item : quotation.getQuotationItems()) {
            subtotal = subtotal.add(item.getTaxableAmount() != null ? item.getTaxableAmount() : BigDecimal.ZERO);
            discountAmount = discountAmount
                    .add(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO);
            taxAmount = taxAmount.add(item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO);
        }

        quotation.setSubtotal(subtotal);
        quotation.setDiscountAmount(discountAmount);
        quotation.setTaxAmount(taxAmount);

        BigDecimal freight = quotation.getFreightCharges() != null ? quotation.getFreightCharges() : BigDecimal.ZERO;
        BigDecimal other = quotation.getOtherCharges() != null ? quotation.getOtherCharges() : BigDecimal.ZERO;

        BigDecimal totalBeforeRound = subtotal.add(taxAmount).add(freight).add(other);
        quotation.setTotalBeforeRoundOff(totalBeforeRound);

        BigDecimal roundedTotal = totalBeforeRound.setScale(0, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedTotal.subtract(totalBeforeRound);

        quotation.setRoundOff(roundOff);
        quotation.setTotalAmount(roundedTotal.setScale(4, RoundingMode.HALF_UP));
    }

    private QuotationProfileResponse buildQuotationProfileResponse(Quotation qt) {
        Company comp = qt.getCompany();
        Customer cust = qt.getCustomer();

        QtCompanyInfoDto compInfo = null;
        if (comp != null) {
            compInfo = QtCompanyInfoDto.builder()
                    .companyId(comp.getId())
                    .companyName(comp.getCompanyName())
                    .legalName(comp.getLegalName())
                    .companyCode(comp.getCompanyCode())
                    .gstin(comp.getGstin())
                    .pan(comp.getPan())
                    .address(comp.getAddressLine1())
                    .city(comp.getCity())
                    .state(comp.getState())
                    .country(comp.getCountry())
                    .postalCode(comp.getPostalCode())
                    .email(comp.getEmail())
                    .phone(comp.getPhone())
                    .website(comp.getWebsite())
                    .logoUrl(comp.getLogoUrl())
                    .companyType(comp.getCompanyType())
                    .build();
        }

        QtCustomerInfoDto custInfo = null;
        if (cust != null) {
            custInfo = QtCustomerInfoDto.builder()
                    .customerId(cust.getId())
                    .customerCode(cust.getCustomerCode())
                    .customerName(cust.getCustomerName())
                    .companyName(null)
                    .gstin(cust.getGstin())
                    .pan(cust.getPanNo())
                    .email(cust.getEmail())
                    .phone(cust.getPhone())
                    .billingAddress(com.erp.account.util.CustomerAddressUtils.getAddressLine1(cust))
                    .shippingAddress(null)
                    .city(com.erp.account.util.CustomerAddressUtils.getCity(cust))
                    .state(com.erp.account.util.CustomerAddressUtils.getState(cust))
                    .country(com.erp.account.util.CustomerAddressUtils.getCountry(cust))
                    .creditLimit(cust.getCreditLimit())
                    .outstandingBalance(null)
                    .availableCredit(null)
                    .build();
        }

        List<QtLineItemDto> items = new java.util.ArrayList<>();
        if (qt.getQuotationItems() != null) {
            for (QuotationItem item : qt.getQuotationItems()) {
                items.add(QtLineItemDto.builder()
                        .itemId(item.getId())
                        .itemCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null)
                        .itemName(item.getItemName())
                        .sku(null)
                        .description(item.getDescription())
                        .hsnSacCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null)
                        .hsnSacDescription(
                                item.getHsnSacMaster() != null ? item.getHsnSacMaster().getDescription() : null)
                        .gstSlab(item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null
                                ? item.getHsnSacMaster().getGstSlab().getSlabName()
                                : null)
                        .quantity(item.getQuantity())
                        .unit(item.getUnit())
                        .unitPrice(item.getUnitPrice())
                        .discountPercentage(item.getDiscountPercent())
                        .discountAmount(item.getDiscountAmount())
                        .taxableAmount(item.getTaxableAmount())
                        .cgst(item.getCgstAmount())
                        .sgst(item.getSgstAmount())
                        .igst(item.getIgstAmount())
                        .cess(item.getCessAmount())
                        .taxAmount(item.getTaxAmount())
                        .totalAmount(item.getTotalAmount())
                        .lineRemarks(item.getNotes())
                        .build());
            }
        }

        QtTaxSummaryDto taxSummary = QtTaxSummaryDto.builder()
                .taxableAmount(qt.getSubtotal())
                .cgst(qt.getQuotationItems().stream().map(QuotationItem::getCgstAmount).reduce(BigDecimal.ZERO,
                        (a, b) -> a != null ? a.add(b != null ? b : BigDecimal.ZERO) : b))
                .sgst(qt.getQuotationItems().stream().map(QuotationItem::getSgstAmount).reduce(BigDecimal.ZERO,
                        (a, b) -> a != null ? a.add(b != null ? b : BigDecimal.ZERO) : b))
                .igst(qt.getQuotationItems().stream().map(QuotationItem::getIgstAmount).reduce(BigDecimal.ZERO,
                        (a, b) -> a != null ? a.add(b != null ? b : BigDecimal.ZERO) : b))
                .cess(qt.getQuotationItems().stream().map(QuotationItem::getCessAmount).reduce(BigDecimal.ZERO,
                        (a, b) -> a != null ? a.add(b != null ? b : BigDecimal.ZERO) : b))
                .totalTax(qt.getTaxAmount())
                .grandTotal(qt.getTotalAmount())
                .build();

        QtAmountSummaryDto amtSummary = QtAmountSummaryDto.builder()
                .subtotal(qt.getSubtotal())
                .discountAmount(qt.getDiscountAmount())
                .freightCharges(qt.getFreightCharges())
                .otherCharges(qt.getOtherCharges())
                .totalBeforeRoundOff(qt.getTotalBeforeRoundOff())
                .roundOff(qt.getRoundOff())
                .totalAmount(qt.getTotalAmount())
                .build();

        QtTermsAndConditionsDto terms = QtTermsAndConditionsDto.builder()
                .paymentTermId(qt.getPaymentTermId())
                .paymentTerms(qt.getPaymentTerms())
                .deliveryTermId(qt.getDeliveryTermId())
                .deliveryTerms(qt.getDeliveryTerms())
                .warrantyTermId(qt.getWarrantyTermId())
                .warrantyTerms(qt.getWarrantyTerms())
                .termsConditionId(qt.getTermsConditionId())
                .termsAndConditions(qt.getTermsAndConditions())
                .notes(qt.getNotes())
                .build();

        QtBillingInfoDto billing = QtBillingInfoDto.builder()
                .billingAddressId(qt.getBillingAddressId())
                .billingAddressLine1(qt.getBillingAddressLine1())
                .billingAddressLine2(qt.getBillingAddressLine2())
                .billingCity(qt.getBillingCity())
                .billingState(qt.getBillingState())
                .billingPostalCode(qt.getBillingPostalCode())
                .billingCountry(qt.getBillingCountry())
                .billingStateCode(qt.getBillingStateCode())
                .build();

        QtDeliveryInfoDto delivery = QtDeliveryInfoDto.builder()
                .deliveryAddressId(qt.getDeliveryAddressId())
                .deliveryAddressLine1(qt.getDeliveryAddressLine1())
                .deliveryAddressLine2(qt.getDeliveryAddressLine2())
                .deliveryCity(qt.getDeliveryCity())
                .deliveryState(qt.getDeliveryState())
                .deliveryPostalCode(qt.getDeliveryPostalCode())
                .deliveryCountry(qt.getDeliveryCountry())
                .build();

        QtApprovalWorkflowDto approval = QtApprovalWorkflowDto.builder()
                .approvalStatus(qt.getStatus() != null ? qt.getStatus().name() : null)
                .approvedBy(qt.getApprovedBy())
                .approvedAt(qt.getApprovedAt())
                .build();

        QtAuditInfoDto audit = QtAuditInfoDto.builder()
                .createdBy(qt.getCreatedBy())
                .createdAt(qt.getCreatedAt())
                .updatedBy(qt.getUpdatedBy())
                .updatedAt(qt.getUpdatedAt())
                .build();

        QtStatisticsDto stats = QtStatisticsDto.builder()
                .itemCount(items.size())
                .build();

        return QuotationProfileResponse.builder()
                .id(qt.getId())
                .quotationNumber(qt.getQuotationNumber())
                .quotationDate(qt.getQuotationDate())
                .validUntil(qt.getValidUntil())
                .status(qt.getStatus() != null ? qt.getStatus().name() : null)
                .currency(qt.getQuotationCurrency())
                .exchangeRate(qt.getExchangeRate())
                .referenceNumber(qt.getReferenceNumber())
                .placeOfSupplyStateId(qt.getPlaceOfSupplyStateId())
                .placeOfSupplyStateCode(qt.getPlaceOfSupplyStateCode())
                .placeOfSupply(null)
                .companyInformation(compInfo)
                .customerInformation(custInfo)
                .lineItems(items)
                .taxSummary(taxSummary)
                .amountSummary(amtSummary)
                .termsAndConditions(terms)
                .billingInformation(billing)
                .deliveryInformation(delivery)
                .approvalWorkflow(approval)
                .auditInformation(audit)
                .statistics(stats)
                .build();
    }
}
