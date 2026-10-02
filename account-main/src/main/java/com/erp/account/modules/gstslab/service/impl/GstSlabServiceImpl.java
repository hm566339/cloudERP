package com.erp.account.modules.gstslab.service.impl;

import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.domain.Specification;

import com.erp.account.modules.gstslab.dto.response.*;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.gstslab.dto.request.GstSlabRequest;
import com.erp.account.common.exception.DuplicateResourceException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.gstslab.mapper.GstSlabMapper;
import com.erp.account.modules.gstslab.dto.request.GstSlabFilterDto;
import com.erp.account.modules.gstslab.specification.GstSlabSpecification;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.gstslab.repository.GstSlabRepository;
import com.erp.account.modules.gstslab.service.GstSlabService;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.ledger.repository.TaxTransactionRepository;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import com.erp.account.modules.ledger.entity.TaxTransaction;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GstSlabServiceImpl implements GstSlabService {

    private final GstSlabRepository gstSlabRepository;
    private final GstSlabMapper gstSlabMapper;
    private final TaxTransactionRepository taxTransactionRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;

    @Override
    public PostResponse createGstSlab(RequestWrapper<GstSlabRequest> requestWrapper) {
        if (!TenantUtils.isSystemAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied: Only System Admin can create GST Slabs");
        }
        GstSlabRequest request = requestWrapper.unwrap();
        log.info("Creating global GST slab");

        if (gstSlabRepository.existsBySlabNameIgnoreCaseAndIsDeletedFalse(request.getSlabName())) {
            log.error("GST slab with name {} already exists", request.getSlabName());
            throw new DuplicateResourceException("GST slab with name: " + request.getSlabName() + " already exists");
        }

        GstSlab gstSlab = gstSlabMapper.toEntity(request);

        GstSlab saved = gstSlabRepository.save(gstSlab);

        log.info("GST slab created successfully with id={}", saved.getId());
        return PostResponse.builder()
                .message("GST slab created successfully")
                .build();
    }

    @Override
    public PostResponse updateGstSlab(RequestWrapper<GstSlabRequest> requestWrapper, UUID gstSlabId) {
        if (!TenantUtils.isSystemAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied: Only System Admin can update GST Slabs");
        }
        GstSlabRequest request = requestWrapper.unwrap();
        log.info("Updating GST slab id={}", gstSlabId);

        GstSlab existing = gstSlabRepository.findByIdAndIsDeletedFalse(gstSlabId)
                .orElseThrow(() -> {
                    log.error("GST slab not found with id={}", gstSlabId);
                    return new ResourceNotFoundException("GST slab not found with id: " + gstSlabId);
                });

        if (!existing.getSlabName().equalsIgnoreCase(request.getSlabName())
                && gstSlabRepository.existsBySlabNameIgnoreCaseAndIsDeletedFalse(request.getSlabName())) {
            log.error("GST slab with name {} already exists", request.getSlabName());
            throw new DuplicateResourceException("GST slab with name: " + request.getSlabName() + " already exists");
        }

        gstSlabMapper.updateEntity(request, existing);
        GstSlab updated = gstSlabRepository.save(existing);

        log.info("GST slab updated successfully with id={}", updated.getId());
        return PostResponse.builder()
                .message("GST slab updated successfully")
                .build();
    }

    @Override
    public GstSlabProfileResponse getGstSlabById(UUID gstSlabId) {
        log.info("Getting GST slab with ID: {}", gstSlabId);

        GstSlab gstSlab = gstSlabRepository.findByIdAndIsDeletedFalse(gstSlabId)
                .orElseThrow(() -> new ResourceNotFoundException("GST slab not found with ID: " + gstSlabId));

        GstSlabProfileResponse profile = new GstSlabProfileResponse();
        org.springframework.beans.BeanUtils.copyProperties(gstSlabMapper.toResponse(gstSlab), profile);
        
        enrichGstSlabProfile(profile, gstSlab);

        return profile;
    }

    private void enrichGstSlabProfile(GstSlabProfileResponse profile, GstSlab gstSlab) {
        // Tax Configuration
        boolean isInterState = false; 
        if (gstSlab.getIgstRate() != null && gstSlab.getIgstRate().compareTo(BigDecimal.ZERO) > 0) {
            isInterState = true;
        }
        boolean isIntraState = false;
        if (gstSlab.getCgstRate() != null && gstSlab.getCgstRate().compareTo(BigDecimal.ZERO) > 0) {
            isIntraState = true;
        }
        
        profile.setTaxConfiguration(GstTaxConfigurationDto.builder()
            .intraStateTax(isIntraState)
            .interStateTax(isInterState)
            .reverseChargeApplicable(false)
            .compositionApplicable(false)
            .gstType("Goods/Services")
            .build());

        // Linked Products via HsnSacMaster
        List<GstLinkedItemDto> linkedItems = new ArrayList<>();
        List<HsnSacMaster> hsnList = gstSlab.getHsnSacMasters() != null ? gstSlab.getHsnSacMasters() : Collections.emptyList();
        
        for (HsnSacMaster hsn : hsnList) {
            linkedItems.add(GstLinkedItemDto.builder()
                .itemId(hsn.getId())
                .itemCode(hsn.getCode())
                .itemName(hsn.getDescription())
                .hsnSacCode(hsn.getCode())
                .unit("N/A")
                .sellingPrice(BigDecimal.ZERO)
                .purchasePrice(BigDecimal.ZERO)
                .status("Active")
                .build());
        }
        profile.setLinkedProducts(linkedItems);

        // Sales Transactions via InvoiceTax
        List<GstSalesTransactionDto> salesTx = new ArrayList<>();
        List<InvoiceTax> invoiceTaxes = gstSlab.getInvoiceTaxes() != null ? gstSlab.getInvoiceTaxes() : Collections.emptyList();
        
        BigDecimal totalSalesCgst = BigDecimal.ZERO;
        BigDecimal totalSalesSgst = BigDecimal.ZERO;
        BigDecimal totalSalesIgst = BigDecimal.ZERO;
        BigDecimal totalSalesCess = BigDecimal.ZERO;
        BigDecimal totalSalesTaxable = BigDecimal.ZERO;

        for (InvoiceTax tax : invoiceTaxes) {
            SalesInvoice invoice = tax.getSalesInvoice();
            if (invoice == null || Boolean.TRUE.equals(invoice.getIsDeleted())) continue;

            BigDecimal cgst = tax.getCgstAmount() != null ? tax.getCgstAmount() : BigDecimal.ZERO;
            BigDecimal sgst = tax.getSgstAmount() != null ? tax.getSgstAmount() : BigDecimal.ZERO;
            BigDecimal igst = tax.getIgstAmount() != null ? tax.getIgstAmount() : BigDecimal.ZERO;
            BigDecimal cess = tax.getCessAmount() != null ? tax.getCessAmount() : BigDecimal.ZERO;
            BigDecimal totalTax = cgst.add(sgst).add(igst).add(cess);
            BigDecimal taxable = tax.getTaxableAmount() != null ? tax.getTaxableAmount() : BigDecimal.ZERO;
            
            totalSalesCgst = totalSalesCgst.add(cgst);
            totalSalesSgst = totalSalesSgst.add(sgst);
            totalSalesIgst = totalSalesIgst.add(igst);
            totalSalesCess = totalSalesCess.add(cess);
            totalSalesTaxable = totalSalesTaxable.add(taxable);

            String customerName = invoice.getCustomer() != null ? invoice.getCustomer().getCustomerName() : "Unknown";

            salesTx.add(GstSalesTransactionDto.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .customerName(customerName)
                .taxableAmount(taxable)
                .cgstAmount(cgst)
                .sgstAmount(sgst)
                .igstAmount(igst)
                .cessAmount(cess)
                .totalTax(totalTax)
                .invoiceTotal(invoice.getTotalAmount())
                .build());
        }
        profile.setSalesTransactions(salesTx);

        // Purchase Transactions via TaxTransaction where sourceType = 'AP_INVOICE'
        List<GstPurchaseTransactionDto> purchaseTx = new ArrayList<>();
        List<TaxTransaction> allTaxTxs = taxTransactionRepository.findAll();
        
        Set<UUID> hsnIds = hsnList.stream().map(HsnSacMaster::getId).collect(Collectors.toSet());
        List<TaxTransaction> purchaseTaxTxs = allTaxTxs.stream()
            .filter(t -> "AP_INVOICE".equals(t.getSourceType()) && t.getHsnSacMaster() != null && hsnIds.contains(t.getHsnSacMaster().getId()))
            .collect(Collectors.toList());

        BigDecimal totalPurchaseCgst = BigDecimal.ZERO;
        BigDecimal totalPurchaseSgst = BigDecimal.ZERO;
        BigDecimal totalPurchaseIgst = BigDecimal.ZERO;
        BigDecimal totalPurchaseCess = BigDecimal.ZERO;
        BigDecimal totalPurchaseTaxable = BigDecimal.ZERO;
        
        Set<UUID> apInvoiceIds = purchaseTaxTxs.stream().map(TaxTransaction::getSourceId).collect(Collectors.toSet());
        Map<UUID, ApInvoice> apInvoiceMap = new HashMap<>();
        if (!apInvoiceIds.isEmpty()) {
            apInvoiceRepository.findAllById(apInvoiceIds).forEach(inv -> apInvoiceMap.put(inv.getId(), inv));
        }

        for (TaxTransaction tx : purchaseTaxTxs) {
            ApInvoice inv = apInvoiceMap.get(tx.getSourceId());
            if (inv == null || Boolean.TRUE.equals(inv.getIsDeleted())) continue;

            BigDecimal cgst = tx.getCgstAmount() != null ? tx.getCgstAmount() : BigDecimal.ZERO;
            BigDecimal sgst = tx.getSgstAmount() != null ? tx.getSgstAmount() : BigDecimal.ZERO;
            BigDecimal igst = tx.getIgstAmount() != null ? tx.getIgstAmount() : BigDecimal.ZERO;
            BigDecimal cess = tx.getCessAmount() != null ? tx.getCessAmount() : BigDecimal.ZERO;
            BigDecimal totalTax = cgst.add(sgst).add(igst).add(cess);
            BigDecimal taxable = tx.getTaxableAmount() != null ? tx.getTaxableAmount() : BigDecimal.ZERO;

            totalPurchaseCgst = totalPurchaseCgst.add(cgst);
            totalPurchaseSgst = totalPurchaseSgst.add(sgst);
            totalPurchaseIgst = totalPurchaseIgst.add(igst);
            totalPurchaseCess = totalPurchaseCess.add(cess);
            totalPurchaseTaxable = totalPurchaseTaxable.add(taxable);
            
            String vendorName = inv.getVendor() != null ? inv.getVendor().getVendorName() : "Unknown";

            purchaseTx.add(GstPurchaseTransactionDto.builder()
                .invoiceId(inv.getId())
                .invoiceNumber(inv.getInvoiceNo())
                .invoiceDate(inv.getInvoiceDate())
                .vendorName(vendorName)
                .taxableAmount(taxable)
                .cgstAmount(cgst)
                .sgstAmount(sgst)
                .igstAmount(igst)
                .cessAmount(cess)
                .totalTax(totalTax)
                .invoiceTotal(inv.getTotalAmount())
                .build());
        }
        profile.setPurchaseTransactions(purchaseTx);

        // GST Summary
        BigDecimal totalTaxableValue = totalSalesTaxable.add(totalPurchaseTaxable);
        BigDecimal totalCgstCollected = totalSalesCgst;
        BigDecimal totalSgstCollected = totalSalesSgst;
        BigDecimal totalIgstCollected = totalSalesIgst;
        BigDecimal totalCessCollected = totalSalesCess;
        BigDecimal totalGstAmount = totalCgstCollected.add(totalSgstCollected).add(totalIgstCollected).add(totalCessCollected);
        
        profile.setGstSummary(GstSummaryDto.builder()
            .totalTaxableValue(totalTaxableValue)
            .totalCgstCollected(totalCgstCollected)
            .totalSgstCollected(totalSgstCollected)
            .totalIgstCollected(totalIgstCollected)
            .totalCessCollected(totalCessCollected)
            .totalGstAmount(totalGstAmount)
            .build());

        // Statistics
        BigDecimal totalTaxPaid = totalPurchaseCgst.add(totalPurchaseSgst).add(totalPurchaseIgst).add(totalPurchaseCess);
        BigDecimal netGstLiability = totalGstAmount.subtract(totalTaxPaid);

        profile.setStatistics(GstStatisticsDto.builder()
            .totalLinkedProducts(linkedItems.size())
            .totalSalesInvoices(salesTx.size())
            .totalPurchaseBills(purchaseTx.size())
            .totalTaxCollected(totalGstAmount)
            .totalTaxPaid(totalTaxPaid)
            .netGstLiability(netGstLiability)
            .build());
            
        // Recent Transactions
        List<GstRecentTransactionDto> recentTx = new ArrayList<>();
        
        for (GstSalesTransactionDto s : salesTx) {
            recentTx.add(GstRecentTransactionDto.builder()
                .transactionId(s.getInvoiceId())
                .transactionType("SALES_INVOICE")
                .invoiceNumber(s.getInvoiceNumber())
                .transactionDate(s.getInvoiceDate())
                .partyName(s.getCustomerName())
                .taxableAmount(s.getTaxableAmount())
                .totalTax(s.getTotalTax())
                .invoiceTotal(s.getInvoiceTotal())
                .build());
        }
        for (GstPurchaseTransactionDto p : purchaseTx) {
            recentTx.add(GstRecentTransactionDto.builder()
                .transactionId(p.getInvoiceId())
                .transactionType("AP_INVOICE")
                .invoiceNumber(p.getInvoiceNumber())
                .transactionDate(p.getInvoiceDate())
                .partyName(p.getVendorName())
                .taxableAmount(p.getTaxableAmount())
                .totalTax(p.getTotalTax())
                .invoiceTotal(p.getInvoiceTotal())
                .build());
        }
        
        recentTx.sort((a, b) -> {
            if (a.getTransactionDate() == null && b.getTransactionDate() == null) return 0;
            if (a.getTransactionDate() == null) return 1;
            if (b.getTransactionDate() == null) return -1;
            return b.getTransactionDate().compareTo(a.getTransactionDate());
        });
        
        profile.setRecentTransactions(recentTx.stream().limit(20).collect(Collectors.toList()));
        
        // Audit
        profile.setAuditInformation(GstAuditInfoDto.builder()
            .createdBy(gstSlab.getCreatedBy())
            .createdAt(gstSlab.getCreatedAt())
            .updatedBy(gstSlab.getUpdatedBy())
            .updatedAt(gstSlab.getUpdatedAt())
            .build());
    }

    @Override
    public GstSlabResponseList getAllGstSlabs(GstSlabFilterDto filter, Pageable pageable) {
        log.info("Fetching GST slabs with filter and pagination");
        
        Specification<GstSlab> spec = GstSlabSpecification.getFilterSpecification(filter);
        
        Page<GstSlab> slabPage = gstSlabRepository.findAll(spec, pageable);

        var responses = slabPage.getContent().stream()
                .map(gstSlabMapper::toResponse)
                .toList();

        PaginationResponse pagination = PaginationResponse.builder()
                .page(slabPage.getNumber() + 1)
                .size(slabPage.getSize())
                .totalPages(slabPage.getTotalPages())
                .totalElements(slabPage.getTotalElements())
                .first(slabPage.isFirst())
                .last(slabPage.isLast())
                .build();

        return GstSlabResponseList.builder()
                .gstSlabs(responses)
                .paginationResponse(pagination)
                .build();
    }

    @Override
    public PostResponse deleteGstSlab(UUID gstSlabId) {
        log.info("Soft deleting GST slab id={}", gstSlabId);

        if (!TenantUtils.isSystemAdmin()) {
            throw new org.springframework.security.access.AccessDeniedException("Access Denied: Only System Admin can delete GST Slabs");
        }

        GstSlab gstSlab = gstSlabRepository.findByIdAndIsDeletedFalse(gstSlabId)
                .orElseThrow(() -> {
                    log.error("GST slab not found with id={}", gstSlabId);
                    return new ResourceNotFoundException("GST slab not found with id: " + gstSlabId);
                });

        gstSlab.setIsDeleted(true);
        gstSlabRepository.save(gstSlab);

        log.info("GST slab soft deleted successfully id={}", gstSlabId);
        return PostResponse.builder()
                .message("GST slab deleted successfully")
                .build();
    }
}
