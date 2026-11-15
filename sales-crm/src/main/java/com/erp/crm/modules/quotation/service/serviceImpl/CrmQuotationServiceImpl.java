package com.erp.crm.modules.quotation.service.serviceImpl;

import com.erp.crm.common.exception.BusinessValidationException;
import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.util.TenantUtils;
import com.erp.crm.modules.account.repository.CrmAccountRepository;
import com.erp.crm.modules.account.repository.CrmContactRepository;
import com.erp.crm.modules.outbox.service.CrmOutboxService;
import com.erp.crm.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.crm.modules.quotation.dto.response.ConvertToSalesOrderResponse;
import com.erp.crm.modules.quotation.dto.response.QuotationResponse;
import com.erp.crm.modules.quotation.entity.CrmQuotation;
import com.erp.crm.modules.quotation.entity.CrmQuotationItem;
import com.erp.crm.modules.quotation.entity.CrmQuotationRevision;
import com.erp.crm.modules.quotation.enums.DiscountType;
import com.erp.crm.modules.quotation.enums.QuotationApprovalStatus;
import com.erp.crm.modules.quotation.enums.QuotationStatus;
import com.erp.crm.modules.quotation.repository.CrmQuotationItemRepository;
import com.erp.crm.modules.quotation.repository.CrmQuotationRepository;
import com.erp.crm.modules.quotation.repository.CrmQuotationRevisionRepository;
import com.erp.crm.modules.quotation.service.CrmQuotationService;
import com.erp.crm.modules.setting.entity.CrmCompanySetting;
import com.erp.crm.modules.setting.repository.CrmCompanySettingRepository;
import com.erp.crm.modules.workflow.client.CrmWorkflowClient;
import com.erp.crm.modules.workflow.dto.WorkflowCallbackRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CrmQuotationServiceImpl implements CrmQuotationService {

    private final CrmQuotationRepository quotationRepository;
    private final CrmQuotationItemRepository itemRepository;
    private final CrmQuotationRevisionRepository revisionRepository;
    private final CrmCompanySettingRepository companySettingRepository;
    private final CrmAccountRepository accountRepository;
    private final CrmContactRepository contactRepository;
    private final CrmWorkflowClient workflowClient;
    private final CrmOutboxService outboxService;

    @Override
    public QuotationResponse createQuotation(QuotationCreateRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        String quoteNumber = generateQuotationNumber();
        log.info("Creating Quotation: {} for companyId: {}", quoteNumber, companyId);

        BigDecimal threshold = companySettingRepository.findByCompanyIdAndIsDeletedFalse(companyId)
                .map(CrmCompanySetting::getDiscountApprovalThreshold)
                .orElse(new BigDecimal("15.00"));

        BigDecimal calculatedSubtotal = BigDecimal.ZERO;
        BigDecimal calculatedTaxTotal = BigDecimal.ZERO;
        BigDecimal maxLineDiscountPct = BigDecimal.ZERO;

        List<CrmQuotationItem> itemsToSave = new ArrayList<>();
        int itemOrder = 1;

        for (QuotationCreateRequest.ItemRequest line : request.getItems()) {
            BigDecimal qty = line.getQuantity();
            BigDecimal price = line.getUnitPrice();
            BigDecimal gross = qty.multiply(price);

            BigDecimal lineDiscountPct = line.getDiscountPct() != null ? line.getDiscountPct() : BigDecimal.ZERO;
            if (lineDiscountPct.compareTo(maxLineDiscountPct) > 0) {
                maxLineDiscountPct = lineDiscountPct;
            }

            BigDecimal lineDiscountAmt = gross.multiply(lineDiscountPct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal taxable = gross.subtract(lineDiscountAmt);

            BigDecimal cgstRate = line.getCgstRate() != null ? line.getCgstRate() : BigDecimal.ZERO;
            BigDecimal sgstRate = line.getSgstRate() != null ? line.getSgstRate() : BigDecimal.ZERO;
            BigDecimal igstRate = line.getIgstRate() != null ? line.getIgstRate() : BigDecimal.ZERO;

            BigDecimal cgstAmt = taxable.multiply(cgstRate).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal sgstAmt = taxable.multiply(sgstRate).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal igstAmt = taxable.multiply(igstRate).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

            BigDecimal lineTax = cgstAmt.add(sgstAmt).add(igstAmt);
            BigDecimal lineTotal = taxable.add(lineTax);

            calculatedSubtotal = calculatedSubtotal.add(taxable);
            calculatedTaxTotal = calculatedTaxTotal.add(lineTax);

            CrmQuotationItem item = CrmQuotationItem.builder()
                    .itemOrder(itemOrder++)
                    .productId(line.getProductId())
                    .productCode(line.getProductCode())
                    .productName(line.getProductName())
                    .hsnSacCode(line.getHsnSacCode())
                    .description(line.getDescription())
                    .quantity(qty)
                    .uom(line.getUom() != null ? line.getUom() : "PCS")
                    .unitPrice(price)
                    .discountPct(lineDiscountPct)
                    .discountAmount(lineDiscountAmt)
                    .taxableAmount(taxable)
                    .cgstRate(cgstRate)
                    .cgstAmount(cgstAmt)
                    .sgstRate(sgstRate)
                    .sgstAmount(sgstAmt)
                    .igstRate(igstRate)
                    .igstAmount(igstAmt)
                    .totalAmount(lineTotal)
                    .build();
            item.setCompanyId(companyId);
            itemsToSave.add(item);
        }

        BigDecimal headerDiscountPct = request.getDiscountPct() != null ? request.getDiscountPct() : BigDecimal.ZERO;
        BigDecimal finalTotal = calculatedSubtotal.add(calculatedTaxTotal);
        if (request.getFreightCharges() != null) finalTotal = finalTotal.add(request.getFreightCharges());
        if (request.getOtherCharges() != null) finalTotal = finalTotal.add(request.getOtherCharges());

        boolean approvalRequired = headerDiscountPct.compareTo(threshold) > 0 || maxLineDiscountPct.compareTo(threshold) > 0;

        CrmQuotation quotation = CrmQuotation.builder()
                .quotationNumber(quoteNumber)
                .quotationDate(request.getQuotationDate())
                .validUntil(request.getValidUntil())
                .opportunityId(request.getOpportunityId())
                .accountId(request.getAccountId())
                .contactId(request.getContactId())
                .revisionNumber(1)
                .subtotal(calculatedSubtotal)
                .discountType(request.getDiscountType() != null ? request.getDiscountType() : DiscountType.PERCENTAGE)
                .discountPct(headerDiscountPct)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(calculatedTaxTotal)
                .freightCharges(request.getFreightCharges() != null ? request.getFreightCharges() : BigDecimal.ZERO)
                .otherCharges(request.getOtherCharges() != null ? request.getOtherCharges() : BigDecimal.ZERO)
                .totalAmount(finalTotal)
                .placeOfSupplyStateCode(request.getPlaceOfSupplyStateCode())
                .paymentTerms(request.getPaymentTerms())
                .deliveryTerms(request.getDeliveryTerms())
                .warrantyTerms(request.getWarrantyTerms())
                .termsAndConditions(request.getTermsAndConditions())
                .internalNotes(request.getInternalNotes())
                .customerNotes(request.getCustomerNotes())
                .ownerUserId(TenantUtils.getCurrentUserId())
                .status(approvalRequired ? QuotationStatus.PENDING_APPROVAL : QuotationStatus.DRAFT)
                .approvalStatus(approvalRequired ? QuotationApprovalStatus.PENDING : QuotationApprovalStatus.NONE)
                .discountApprovalRequired(approvalRequired)
                .build();
        quotation.setCompanyId(companyId);

        CrmQuotation savedQuotation = quotationRepository.save(quotation);

        for (CrmQuotationItem item : itemsToSave) {
            item.setQuotationId(savedQuotation.getId());
            itemRepository.save(item);
        }

        // Save Revision Snapshot
        revisionRepository.save(CrmQuotationRevision.builder()
                .companyId(companyId)
                .quotationId(savedQuotation.getId())
                .revisionNumber(1)
                .revisionNotes("Initial quotation generation")
                .snapshotJson("{\"quoteNumber\":\"" + quoteNumber + "\",\"totalAmount\":" + finalTotal + "}")
                .revisedByUserId(TenantUtils.getCurrentUserId())
                .build());

        // If approval required, initiate workflow transaction
        if (approvalRequired) {
            Map<String, Object> vars = new HashMap<>();
            vars.put("totalAmount", finalTotal);
            vars.put("discountPct", headerDiscountPct);
            vars.put("quoteNumber", quoteNumber);
            UUID txnId = workflowClient.initiateQuotationApproval(companyId, savedQuotation.getId(),
                    quoteNumber, TenantUtils.getCurrentUserId(), "Current User", vars);
            savedQuotation.setWorkflowTransactionId(txnId);
            quotationRepository.save(savedQuotation);
        }

        return enrichResponse(savedQuotation);
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationResponse getQuotationById(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmQuotation quotation = quotationRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));
        return enrichResponse(quotation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuotationResponse> getAllQuotations(UUID requestCompanyId, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        return quotationRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable)
                .map(this::enrichResponse);
    }

    @Override
    public QuotationResponse submitForApproval(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmQuotation quotation = quotationRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));

        quotation.setStatus(QuotationStatus.PENDING_APPROVAL);
        quotation.setApprovalStatus(QuotationApprovalStatus.PENDING);

        Map<String, Object> vars = new HashMap<>();
        vars.put("totalAmount", quotation.getTotalAmount());
        vars.put("discountPct", quotation.getDiscountPct());
        vars.put("quoteNumber", quotation.getQuotationNumber());

        UUID txnId = workflowClient.initiateQuotationApproval(companyId, quotation.getId(),
                quotation.getQuotationNumber(), TenantUtils.getCurrentUserId(), "Current User", vars);
        quotation.setWorkflowTransactionId(txnId);

        return enrichResponse(quotationRepository.save(quotation));
    }

    @Override
    public void handleWorkflowCallback(WorkflowCallbackRequest callback) {
        log.info("Received workflow callback for doc: {} [action: {}, status: {}]",
                callback.getDocumentId(), callback.getAction(), callback.getStatus());

        Optional<CrmQuotation> opt = quotationRepository.findById(callback.getDocumentId());
        if (opt.isEmpty()) {
            log.warn("Quotation not found for callback docId: {}", callback.getDocumentId());
            return;
        }

        CrmQuotation quotation = opt.get();
        if ("APPROVE".equalsIgnoreCase(callback.getAction()) || "APPROVED".equalsIgnoreCase(callback.getStatus())) {
            quotation.setStatus(QuotationStatus.APPROVED);
            quotation.setApprovalStatus(QuotationApprovalStatus.APPROVED);
            quotation.setApprovedAt(LocalDateTime.now());
            quotation.setApprovedByUserId(callback.getResolvedByUserId());
            log.info("Quotation {} marked APPROVED via workflow-service callback", quotation.getQuotationNumber());
        } else if ("REJECT".equalsIgnoreCase(callback.getAction()) || "REJECTED".equalsIgnoreCase(callback.getStatus())) {
            quotation.setStatus(QuotationStatus.REJECTED);
            quotation.setApprovalStatus(QuotationApprovalStatus.REJECTED);
            log.info("Quotation {} marked REJECTED via workflow-service callback", quotation.getQuotationNumber());
        }

        quotationRepository.save(quotation);
        outboxService.publishEvent(quotation.getCompanyId(), "QUOTATION", quotation.getId(),
                "QUOTATION_WORKFLOW_RESOLVED", "{\"action\":\"" + callback.getAction() + "\"}");
    }

    @Override
    public ConvertToSalesOrderResponse convertToSalesOrder(UUID id, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        CrmQuotation quotation = quotationRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found with id: " + id));

        if (quotation.getStatus() == QuotationStatus.PENDING_APPROVAL) {
            throw new BusinessValidationException("Cannot convert quotation while approval is pending.");
        }

        UUID soId = UUID.randomUUID();
        String soNumber = "SO-" + LocalDate.now().getYear() + "-" + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999));

        quotation.setStatus(QuotationStatus.CONVERTED_TO_ORDER);
        quotation.setAccountMainSalesOrderId(soId);
        quotationRepository.save(quotation);

        // Publish event to Outbox for account-main to consume
        outboxService.publishEvent(companyId, "QUOTATION", quotation.getId(),
                "QUOTATION_CONVERTED_TO_ORDER",
                "{\"quotationId\":\"" + quotation.getId() + "\",\"salesOrderId\":\"" + soId + "\",\"soNumber\":\"" + soNumber + "\"}");

        return ConvertToSalesOrderResponse.builder()
                .quotationId(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .salesOrderId(soId)
                .salesOrderNumber(soNumber)
                .status("CONVERTED_TO_ORDER")
                .build();
    }

    private String generateQuotationNumber() {
        return "QT-" + LocalDate.now().getYear() + "-" + String.format("%05d", ThreadLocalRandom.current().nextInt(1, 99999));
    }

    private QuotationResponse enrichResponse(CrmQuotation quotation) {
        String accName = quotation.getAccountId() != null
                ? accountRepository.findByCompanyIdAndIdAndIsDeletedFalse(quotation.getCompanyId(), quotation.getAccountId()).map(a -> a.getAccountName()).orElse("")
                : "";
        String conName = quotation.getContactId() != null
                ? contactRepository.findByCompanyIdAndIdAndIsDeletedFalse(quotation.getCompanyId(), quotation.getContactId()).map(c -> c.getDisplayName()).orElse("")
                : "";

        List<CrmQuotationItem> items = itemRepository.findByCompanyIdAndQuotationIdAndIsDeletedFalseOrderByItemOrderAsc(
                quotation.getCompanyId(), quotation.getId());

        List<QuotationResponse.ItemResponse> itemResponses = items.stream().map(i -> QuotationResponse.ItemResponse.builder()
                .id(i.getId())
                .itemOrder(i.getItemOrder())
                .productId(i.getProductId())
                .productCode(i.getProductCode())
                .productName(i.getProductName())
                .hsnSacCode(i.getHsnSacCode())
                .quantity(i.getQuantity())
                .uom(i.getUom())
                .unitPrice(i.getUnitPrice())
                .discountPct(i.getDiscountPct())
                .discountAmount(i.getDiscountAmount())
                .taxableAmount(i.getTaxableAmount())
                .cgstRate(i.getCgstRate())
                .cgstAmount(i.getCgstAmount())
                .sgstRate(i.getSgstRate())
                .sgstAmount(i.getSgstAmount())
                .igstRate(i.getIgstRate())
                .igstAmount(i.getIgstAmount())
                .totalAmount(i.getTotalAmount())
                .build()).toList();

        return QuotationResponse.builder()
                .id(quotation.getId())
                .companyId(quotation.getCompanyId())
                .quotationNumber(quotation.getQuotationNumber())
                .quotationDate(quotation.getQuotationDate())
                .validUntil(quotation.getValidUntil())
                .opportunityId(quotation.getOpportunityId())
                .accountId(quotation.getAccountId())
                .accountName(accName)
                .contactId(quotation.getContactId())
                .contactName(conName)
                .revisionNumber(quotation.getRevisionNumber())
                .currency(quotation.getCurrency())
                .subtotal(quotation.getSubtotal())
                .discountType(quotation.getDiscountType())
                .discountPct(quotation.getDiscountPct())
                .discountAmount(quotation.getDiscountAmount())
                .taxAmount(quotation.getTaxAmount())
                .freightCharges(quotation.getFreightCharges())
                .otherCharges(quotation.getOtherCharges())
                .totalAmount(quotation.getTotalAmount())
                .placeOfSupplyStateCode(quotation.getPlaceOfSupplyStateCode())
                .status(quotation.getStatus())
                .approvalStatus(quotation.getApprovalStatus())
                .discountApprovalRequired(quotation.getDiscountApprovalRequired())
                .workflowTransactionId(quotation.getWorkflowTransactionId())
                .accountMainSalesOrderId(quotation.getAccountMainSalesOrderId())
                .items(itemResponses)
                .createdAt(quotation.getCreatedAt())
                .updatedAt(quotation.getUpdatedAt())
                .build();
    }
}

