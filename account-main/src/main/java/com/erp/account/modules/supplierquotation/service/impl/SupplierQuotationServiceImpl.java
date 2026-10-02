package com.erp.account.modules.supplierquotation.service.impl;

import com.erp.account.common.exception.*;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.rfq.entity.*;
import com.erp.account.modules.rfq.repository.RfqRepository;
import com.erp.account.modules.supplierquotation.dto.*;
import com.erp.account.modules.supplierquotation.entity.*;
import com.erp.account.modules.supplierquotation.mapper.SupplierQuotationMapper;
import com.erp.account.modules.supplierquotation.repository.SupplierQuotationRepository;
import com.erp.account.modules.supplierquotation.service.SupplierQuotationService;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierQuotationServiceImpl implements SupplierQuotationService {
  private final SupplierQuotationRepository repository;
  private final RfqRepository rfqRepository;
  private final VendorRepository vendorRepository;
  private final CompanyRepository companyRepository;
  private final VoucherSequenceService sequence;
  private final SupplierQuotationMapper mapper;

  @Override
  @Transactional
  public SupplierQuotationResponse create(UUID companyId, SupplierQuotationRequest request) {
    UUID company = TenantUtils.resolveCompanyId(companyId);
    Company companyEntity = companyRepository.findById(company)
        .orElseThrow(() -> new BadRequestException("Company not found"));
    Rfq rfq = rfqRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getRfqId(), company)
        .orElseThrow(() -> new BadRequestException("RFQ not found"));
    if (rfq.getStatus() != RfqStatus.SENT && rfq.getStatus() != RfqStatus.RESPONSE_RECEIVED
        && rfq.getStatus() != RfqStatus.EVALUATION)
      throw new BadRequestException("RFQ is not accepting quotations in status " + rfq.getStatus());
    Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(request.getVendorId(), company)
        .orElseThrow(() -> new BadRequestException("Vendor not found"));
    if (!rfq.getVendors().stream().anyMatch(v -> v.getVendorId().equals(request.getVendorId())))
      throw new BadRequestException("Vendor was not invited to this RFQ");
    if (repository.existsByRfqIdAndVendorIdAndIsDeletedFalse(rfq.getId(), request.getVendorId()))
      throw new BadRequestException("A quotation already exists for this vendor and RFQ");
    SupplierQuotation q = SupplierQuotation.builder().companyId(company).company(companyEntity)
        .quotationNumber(sequence.generateNextSupplierQuotationNumber(company,
            request.getQuotationDate() != null ? request.getQuotationDate() : LocalDate.now()))
        .rfqId(rfq.getId()).rfq(rfq).vendorId(request.getVendorId()).vendor(vendor)
        .quotationDate(request.getQuotationDate() != null ? request.getQuotationDate() : LocalDate.now())
        .validUntil(request.getValidUntil()).deliveryTerms(request.getDeliveryTerms())
        .paymentTerms(request.getPaymentTerms())
        .freight(request.getFreight() == null ? BigDecimal.ZERO : request.getFreight())
        .discount(request.getDiscount() == null ? BigDecimal.ZERO : request.getDiscount()).remarks(request.getRemarks())
        .status(SupplierQuotationStatus.SUBMITTED).build();
    if (q.getFreight().signum() < 0 || q.getDiscount().signum() < 0)
      throw new BadRequestException("Freight and discount cannot be negative");
    for (SupplierQuotationItemRequest item : request.getItems()) {
      if (item == null || item.getQuantity() == null || item.getUnitPrice() == null || item.getQuantity().signum() <= 0
          || item.getUnitPrice().signum() < 0)
        throw new BadRequestException("Quantity must be positive and price cannot be negative");
      RfqItem rfqItem = rfq.getItems().stream()
          .filter(i -> item.getItemId() != null ? item.getItemId().equals(i.getItemId())
              : item.getItemName().equalsIgnoreCase(i.getItemName()))
          .findFirst().orElseThrow(() -> new BadRequestException("Quotation item is not present in RFQ"));
      if (item.getQuantity().compareTo(rfqItem.getQuantity()) > 0)
        throw new BadRequestException("Quotation quantity exceeds RFQ quantity for " + item.getItemName());
      q.addItem(SupplierQuotationItem.builder().itemId(item.getItemId()).itemName(item.getItemName())
          .description(item.getDescription()).itemType(item.getItemType()).quantity(item.getQuantity())
          .unit(item.getUnit()).unitPrice(item.getUnitPrice())
          .discount(item.getDiscount() == null ? BigDecimal.ZERO : item.getDiscount())
          .cgstRate(item.getCgstRate() == null ? BigDecimal.ZERO : item.getCgstRate())
          .sgstRate(item.getSgstRate() == null ? BigDecimal.ZERO : item.getSgstRate())
          .igstRate(item.getIgstRate() == null ? BigDecimal.ZERO : item.getIgstRate())
          .cessRate(item.getCessRate() == null ? BigDecimal.ZERO : item.getCessRate())
          .deliveryDate(item.getDeliveryDate()).hsnSacId(item.getHsnSacId()).build());
    }
    q.calculateTotals();
    rfq.setStatus(RfqStatus.RESPONSE_RECEIVED);
    rfqRepository.save(rfq);
    return mapper.toResponse(repository.save(q));
  }

  @Override
  @Transactional(readOnly = true)
  public SupplierQuotationResponse get(UUID c, UUID id) {
    return mapper.toResponse(load(c, id));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<SupplierQuotationResponse> list(UUID c, Pageable p) {
    UUID company = TenantUtils.resolveCompanyIdForQuery(c);
    if (company == null)
      return repository.findAll(p).map(mapper::toResponse);
    return repository.findByCompanyIdAndIsDeletedFalse(company, p).map(mapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public List<SupplierQuotationResponse> compareByRfq(UUID c, UUID rfqId) {
    UUID company = TenantUtils.resolveCompanyId(c);
    rfqRepository.findByIdAndCompanyIdAndIsDeletedFalse(rfqId, company)
        .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + rfqId));
    return repository.findByRfqIdAndCompanyIdAndIsDeletedFalse(rfqId, company).stream().map(mapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public SupplierQuotationResponse award(UUID c, UUID id) {
    SupplierQuotation q = repository.findForUpdate(id, TenantUtils.resolveCompanyId(c))
        .orElseThrow(() -> new ResourceNotFoundException("Supplier quotation not found: " + id));
    if (q.getStatus() != SupplierQuotationStatus.SUBMITTED)
      throw new BadRequestException("Only SUBMITTED quotations can be awarded");
    Rfq rfq = rfqRepository.findForUpdate(q.getRfqId(), q.getCompanyId())
        .orElseThrow(() -> new ResourceNotFoundException("RFQ not found"));
    if (rfq.getStatus() == RfqStatus.AWARDED || rfq.getStatus() == RfqStatus.CLOSED)
      throw new BadRequestException("RFQ is already closed or awarded");
    q.setStatus(SupplierQuotationStatus.AWARDED);
    q.setAwardedBy(TenantUtils.getCurrentUserId());
    q.setAwardedAt(LocalDateTime.now());
    rfq.setStatus(RfqStatus.AWARDED);
    rfqRepository.save(rfq);
    for (SupplierQuotation other : repository.findByRfqIdAndCompanyIdAndIsDeletedFalse(q.getRfqId(), q.getCompanyId()))
      if (!other.getId().equals(q.getId()) && other.getStatus() == SupplierQuotationStatus.SUBMITTED)
        other.setStatus(SupplierQuotationStatus.REJECTED);
    return mapper.toResponse(repository.save(q));
  }

  private SupplierQuotation load(UUID c, UUID id) {
    return repository.findByIdAndCompanyIdAndIsDeletedFalse(id, TenantUtils.resolveCompanyId(c))
        .orElseThrow(() -> new ResourceNotFoundException("Supplier quotation not found: " + id));
  }
}
