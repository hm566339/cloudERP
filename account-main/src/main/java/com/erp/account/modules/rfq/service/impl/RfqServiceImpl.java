package com.erp.account.modules.rfq.service.impl;

import com.erp.account.common.exception.*;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.purchaserequisition.entity.*;
import com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
import com.erp.account.modules.rfq.dto.*;
import com.erp.account.modules.rfq.entity.*;
import com.erp.account.modules.rfq.repository.*;
import com.erp.account.modules.rfq.mapper.RfqMapper;
import com.erp.account.modules.rfq.service.RfqEmailService;
import com.erp.account.modules.rfq.service.RfqService;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import com.erp.account.common.service.EmailService;
import com.erp.account.modules.rfq.service.RfqPdfService;
import com.erp.account.modules.unit.service.UnitService;
import com.erp.account.modules.vendor.entity.Vendor;
import lombok.extern.slf4j.Slf4j;
import java.util.regex.Pattern;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RfqServiceImpl implements RfqService {
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
  private final RfqRepository repository;
  private final PurchaseRequisitionRepository requisitionRepository;
  private final VendorRepository vendorRepository;
  private final CompanyRepository companyRepository;
  private final VoucherSequenceService sequence;
  private final RfqPdfService rfqPdfService;
  private final RfqEmailService rfqEmailService;
  private final UnitService unitService;
  private final RfqMapper rfqMapper;

  @Override
  @Transactional
  public RfqResponse create(UUID companyId, RfqRequest request) {
    UUID company = TenantUtils.resolveCompanyId(companyId);
    Company companyEntity = companyRepository.findById(company)
        .orElseThrow(() -> new BadRequestException("Company not found"));
    PurchaseRequisition pr = requisitionRepository
        .findByIdAndCompanyIdAndIsDeletedFalse(request.getPurchaseRequisitionId(), company)
        .orElseThrow(() -> new BadRequestException("Purchase Requisition not found"));
    if (pr.getStatus() != PurchaseRequisitionStatus.APPROVED)
      throw new BadRequestException("Only APPROVED requisitions can create an RFQ");
    if (request.getVendorIds() == null || request.getVendorIds().isEmpty())
      throw new BadRequestException("At least one vendor is required");
    if (request.getVendorIds().stream().distinct().count() != request.getVendorIds().size())
      throw new BadRequestException("Duplicate vendor invitation");
    for (UUID vendorId : request.getVendorIds())
      vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, company)
          .orElseThrow(() -> new BadRequestException("Vendor not found: " + vendorId));
    if (request.getItems() == null || request.getItems().isEmpty())
      throw new BadRequestException("At least one RFQ item is required");
    Rfq rfq = Rfq.builder().companyId(company).company(companyEntity)
        .rfqNumber(sequence.generateNextRfqNumber(company,
            request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now()))
        .purchaseRequisitionId(pr.getId()).purchaseRequisition(pr)
        .issueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now())
        .quotationDeadline(request.getQuotationDeadline()).expectedDeliveryDate(request.getExpectedDeliveryDate())
        .terms(request.getTerms()).notes(request.getNotes()).build();
    for (RfqItemRequest item : request.getItems()) {
      if (item == null || item.getQuantity() == null || item.getQuantity().signum() <= 0)
        throw new BadRequestException("RFQ quantity must be greater than zero");
      if (unitService != null && item.getUnit() != null)
        unitService.validateQuantity(item.getQuantity(), item.getUnit());
      if (item.getRequiredDate() != null && item.getRequiredDate().isBefore(rfq.getIssueDate()))
        throw new BadRequestException("Item required date cannot precede RFQ issue date");
      rfq.addItem(rfqMapper.toItemEntity(item));
    }
    for (UUID vendorId : request.getVendorIds())
      rfq.addVendor(RfqVendor.builder().vendorId(vendorId).build());
    return rfqMapper.toResponse(repository.save(rfq));
  }

  @Override
  @Transactional(readOnly = true)
  public RfqResponse get(UUID c, UUID id) {
    return rfqMapper.toResponse(load(c, id));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<RfqResponse> list(UUID c, Pageable p) {
    UUID company = TenantUtils.resolveCompanyIdForQuery(c);
    if (company == null)
      return repository.findAll(p).map(rfqMapper::toResponse);
    return repository.findByCompanyIdAndIsDeletedFalse(company, p).map(rfqMapper::toResponse);
  }

  @Override
  @Transactional
  public RfqResponse update(UUID c, UUID id, RfqRequest request) {
    UUID company = TenantUtils.resolveCompanyId(c);
    Rfq e = load(c, id);
    if (e.getStatus() != RfqStatus.DRAFT)
      throw new BadRequestException("Only DRAFT RFQs can be edited");
    PurchaseRequisition pr = requisitionRepository
        .findByIdAndCompanyIdAndIsDeletedFalse(request.getPurchaseRequisitionId(), company)
        .orElseThrow(() -> new BadRequestException("Purchase Requisition not found"));
    if (pr.getStatus() != PurchaseRequisitionStatus.APPROVED)
      throw new BadRequestException("Only APPROVED requisitions can create an RFQ");
    if (request.getVendorIds() == null || request.getVendorIds().isEmpty()
        || request.getVendorIds().stream().distinct().count() != request.getVendorIds().size())
      throw new BadRequestException("At least one unique vendor is required");
    for (UUID vendorId : request.getVendorIds())
      vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, company)
          .orElseThrow(() -> new BadRequestException("Vendor not found: " + vendorId));
    if (request.getItems() == null || request.getItems().isEmpty())
      throw new BadRequestException("At least one RFQ item is required");
    e.setPurchaseRequisitionId(pr.getId());
    e.setPurchaseRequisition(pr);
    e.setIssueDate(request.getIssueDate() != null ? request.getIssueDate() : e.getIssueDate());
    e.setQuotationDeadline(request.getQuotationDeadline());
    e.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
    e.setTerms(request.getTerms());
    e.setNotes(request.getNotes());
    e.getItems().clear();
    e.getVendors().clear();
    for (RfqItemRequest item : request.getItems()) {
      if (item == null || item.getQuantity() == null || item.getQuantity().signum() <= 0)
        throw new BadRequestException("RFQ quantity must be greater than zero");
      if (unitService != null && item.getUnit() != null)
        unitService.validateQuantity(item.getQuantity(), item.getUnit());
      e.addItem(rfqMapper.toItemEntity(item));
    }
    for (UUID vendorId : request.getVendorIds())
      e.addVendor(RfqVendor.builder().vendorId(vendorId).build());
    return rfqMapper.toResponse(repository.save(e));
  }

  @Override
  @Transactional
  public RfqSendResponse send(UUID c, UUID id) {
    log.info("RFQ send transition started\nRFQ ID: {}", id);
    UUID company = TenantUtils.resolveCompanyId(c);
    Rfq e = loadForUpdate(c, id);
    
    if (e.getStatus() != RfqStatus.DRAFT) {
      throw new BadRequestException("Only DRAFT RFQs can be sent");
    }
    if (e.getVendors() == null || e.getVendors().isEmpty()) {
      throw new BadRequestException("At least one vendor is required to send the RFQ");
    }

    // 1. Transition status to SENT first — this is the primary operation
    e.setStatus(RfqStatus.SENT);
    Rfq saved = repository.save(e);

    // 2. Delegate email dispatch to dedicated service
    RfqEmailDispatchResponse dispatchResponse = rfqEmailService.dispatchRfqEmails(company, id);

    int emailsSentCount = dispatchResponse.getEmailsSentCount();
    int emailsFailedCount = dispatchResponse.getEmailsFailedCount();
    int vendorsWithoutEmail = dispatchResponse.getVendorsWithoutEmail();
    boolean emailSent = dispatchResponse.isEmailSent();

    // 3. Build contextual message
    String message;
    int totalVendors = e.getVendors().size();
    if (emailsSentCount == totalVendors) {
      message = "RFQ sent successfully and email sent successfully.";
    } else if (emailsSentCount > 0) {
      message = String.format("RFQ marked as SENT successfully. Email sent to %d of %d vendors.", emailsSentCount,
          totalVendors);
    } else if (vendorsWithoutEmail == totalVendors) {
      message = "RFQ marked as SENT successfully. Vendor email is not available, so email was not sent.";
    } else if (emailsFailedCount > 0) {
      message = "RFQ marked as SENT successfully, but email could not be sent.";
    } else {
      message = "RFQ marked as SENT successfully.";
    }

    return RfqSendResponse.builder()
        .rfq(rfqMapper.toResponse(saved))
        .emailSent(emailSent)
        .emailsSentCount(emailsSentCount)
        .emailsFailedCount(emailsFailedCount)
        .vendorsWithoutEmail(vendorsWithoutEmail)
        .message(message)
        .build();
  }

  @Override
  @Transactional
  public RfqResponse close(UUID c, UUID id) {
    Rfq e = loadForUpdate(c, id);
    if (e.getStatus() != RfqStatus.SENT && e.getStatus() != RfqStatus.RESPONSE_RECEIVED
        && e.getStatus() != RfqStatus.EVALUATION)
      throw new BadRequestException("RFQ cannot be closed in status " + e.getStatus());
    e.setStatus(RfqStatus.CLOSED);
    return rfqMapper.toResponse(repository.save(e));
  }

  @Override
  @Transactional
  public RfqResponse cancel(UUID c, UUID id) {
    Rfq e = loadForUpdate(c, id);
    if (e.getStatus() == RfqStatus.AWARDED || e.getStatus() == RfqStatus.CLOSED || e.getStatus() == RfqStatus.CANCELLED)
      throw new BadRequestException("RFQ cannot be cancelled in status " + e.getStatus());
    e.setStatus(RfqStatus.CANCELLED);
    return rfqMapper.toResponse(repository.save(e));
  }

  private Rfq load(UUID c, UUID id) {
    return repository.findByIdAndCompanyIdAndIsDeletedFalse(id, TenantUtils.resolveCompanyId(c))
        .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + id));
  }

  private Rfq loadForUpdate(UUID c, UUID id) {
    return repository.findForUpdate(id, TenantUtils.resolveCompanyId(c))
        .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + id));
  }
}
