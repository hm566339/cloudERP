package com.erp.account.modules.invoicetax.service.impl;

import com.erp.account.modules.invoicetax.dto.InvoiceTaxRequest;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.exception.InvoiceTaxNotFoundException;
import com.erp.account.common.exception.InvalidGstSlabException;
import com.erp.account.common.exception.InvalidOperationException;
import com.erp.account.common.exception.InvalidTaxCalculationException;
import com.erp.account.common.exception.SalesInvoiceNotFoundException;
import com.erp.account.modules.invoicetax.mapper.InvoiceTaxMapper;
import com.erp.account.modules.invoicetax.dto.InvoiceTaxFilterDto;
import com.erp.account.modules.invoicetax.specification.InvoiceTaxSpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.gstslab.repository.GstSlabRepository;
import com.erp.account.modules.invoicetax.repository.InvoiceTaxRepository;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.Invoice;
import com.erp.account.util.InvoiceCalculationHelper;
import com.erp.account.util.TaxCalculationHelper;
import com.erp.account.util.CustomerAddressUtils;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.invoicetax.service.InvoiceTaxService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;


@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class InvoiceTaxServiceImpl implements InvoiceTaxService {

    private final InvoiceTaxRepository invoiceTaxRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final GstSlabRepository gstSlabRepository;
    private final InvoiceTaxMapper invoiceTaxMapper;
    private final ApplicationEventPublisher eventPublisher;


    @Override
    public InvoiceTaxResponse createInvoiceTax(UUID invoiceId, RequestWrapper<InvoiceTaxRequest> requestWrapper, UUID companyId) {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        InvoiceTaxRequest request = requestWrapper.unwrap();
        SalesInvoice invoice = getInvoice(invoiceId, resolvedCompanyId);
        ensureInvoiceIsEditable(invoice);

        GstSlab gstSlab = gstSlabRepository.findById(request.getGstSlabId())
                .orElseThrow(() -> new InvalidGstSlabException("GST slab not found with id: " + request.getGstSlabId()));


        validateInvoiceTaxRequest(request, invoice);

        InvoiceTax entity = invoiceTaxMapper.requestToEntity(request);
        entity.setSalesInvoice(invoice);
        entity.setCompany(invoice.getCompany());
        entity.setGstSlab(gstSlab);
        scaleTaxAmounts(entity);

        InvoiceTax saved = invoiceTaxRepository.save(entity);
        // publish eviction after successful save
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
        return invoiceTaxMapper.entityToResponse(saved);
    }

    @Override
    public InvoiceTaxResponse updateInvoiceTax(UUID invoiceId, UUID taxId, RequestWrapper<InvoiceTaxRequest> requestWrapper, UUID companyId) {
        InvoiceTaxRequest request = requestWrapper.unwrap();
        InvoiceTax existing = invoiceTaxRepository.findByIdAndCompanyIdAndIsDeletedFalse(taxId, companyId)
                .orElseThrow(() -> new InvoiceTaxNotFoundException("Invoice tax not found with id: " + taxId));

        if (!existing.getSalesInvoice().getId().equals(invoiceId)) {
            throw new InvalidOperationException("Invoice tax does not belong to the specified invoice", "INVOICE_TAX_INVOICE_MISMATCH");
        }

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        SalesInvoice invoice = getInvoice(invoiceId, resolvedCompanyId);
        ensureInvoiceIsEditable(invoice);

        GstSlab gstSlab = gstSlabRepository.findById(request.getGstSlabId())
                .orElseThrow(() -> new InvalidGstSlabException("GST slab not found with id: " + request.getGstSlabId()));


        validateInvoiceTaxRequest(request, invoice);
        invoiceTaxMapper.updateEntityFromRequest(request, existing);
        existing.setSalesInvoice(invoice);
        existing.setCompany(invoice.getCompany());
        existing.setGstSlab(gstSlab);
        scaleTaxAmounts(existing);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        InvoiceTax saved = invoiceTaxRepository.save(existing);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
        return invoiceTaxMapper.entityToResponse(saved);
    }

    @Override
    public void deleteInvoiceTax(UUID invoiceId, UUID taxId, UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        InvoiceTax existing = invoiceTaxRepository.findByIdAndCompanyIdAndIsDeletedFalse(taxId, resolvedCompanyId)
                .orElseThrow(() -> new InvoiceTaxNotFoundException("Invoice tax not found with id: " + taxId));

        if (!existing.getSalesInvoice().getId().equals(invoiceId)) {
            throw new InvalidOperationException("Invoice tax does not belong to the specified invoice", "INVOICE_TAX_INVOICE_MISMATCH");
        }

        ensureInvoiceIsEditable(existing.getSalesInvoice());
        existing.setIsDeleted(true);
        existing.setUpdatedBy(CurrentUserContext.getUserId());
        InvoiceTax deleted = invoiceTaxRepository.save(existing);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceTaxResponse getInvoiceTax(UUID invoiceId, UUID taxId, UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        InvoiceTax tax = invoiceTaxRepository.findByIdAndCompanyIdAndIsDeletedFalse(taxId, resolvedCompanyId)
                .orElseThrow(() -> new InvoiceTaxNotFoundException("Invoice tax not found with id: " + taxId));

        if (!tax.getSalesInvoice().getId().equals(invoiceId)) {
            throw new InvalidOperationException("Invoice tax does not belong to the specified invoice", "INVOICE_TAX_INVOICE_MISMATCH");
        }

        return invoiceTaxMapper.entityToResponse(tax);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceTaxResponse> getInvoiceTaxes(UUID invoiceId, InvoiceTaxFilterDto filter, Pageable pageable) {
        log.info("Fetching invoice taxes with filter and pagination for invoiceId={}", invoiceId);
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());
        Specification<InvoiceTax> spec = InvoiceTaxSpecification.getFilterSpecification(filter, invoiceId, resolvedCompanyId);

        return invoiceTaxRepository.findAll(spec, pageable)
                .map(invoiceTaxMapper::entityToResponse);
    }

    private SalesInvoice getInvoice(UUID invoiceId, UUID companyId) {
        SalesInvoice invoice = salesInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)
                .orElseThrow(() -> new SalesInvoiceNotFoundException("Sales invoice not found with id: " + invoiceId));

        if (!invoice.getCompanyId().equals(companyId)) {
            throw new ForbiddenException("Sales invoice does not belong to the requesting company", "COMPANY_MISMATCH");
        }

        return invoice;
    }

    private void ensureInvoiceIsEditable(SalesInvoice invoice) {
        if (!invoice.isEditable()) {
            throw new InvalidOperationException("Cannot modify taxes for invoice with status: " + invoice.getStatus(), "INVOICE_NOT_EDITABLE");
        }
    }



    private void validateInvoiceTaxRequest(InvoiceTaxRequest request, SalesInvoice invoice) {
        if (request.getTaxableAmount() == null || request.getTaxableAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxCalculationException("Taxable amount must be a positive number", "INVALID_TAXABLE_AMOUNT");
        }

        TaxCalculationHelper.validateTaxComponents(request.getCgstAmount(), request.getSgstAmount(), request.getIgstAmount());
        TaxCalculationHelper.validateTaxApplicability(request.getCgstAmount(), request.getSgstAmount(), request.getIgstAmount());

        if (request.getCessAmount() != null && request.getCessAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxCalculationException("CESS amount cannot be negative", "NEGATIVE_CESS_AMOUNT");
        }

        if (request.getCgstAmount() == null && request.getSgstAmount() == null && request.getIgstAmount() == null) {
            throw new InvalidTaxCalculationException("At least one GST component must be provided", "MISSING_TAX_COMPONENT");
        }

        validatePlaceOfSupply(invoice, request);
    }

    private void validatePlaceOfSupply(SalesInvoice invoice, InvoiceTaxRequest request) {
        if (invoice.getPlaceOfSupplyStateCode() == null || invoice.getPlaceOfSupplyStateCode().isBlank()) {
            throw new InvalidTaxCalculationException("Invoice place of supply is required for tax computation", "MISSING_PLACE_OF_SUPPLY");
        }

        if (CustomerAddressUtils.getDefaultAddress(invoice.getCustomer()) != null
            && CustomerAddressUtils.getDefaultAddress(invoice.getCustomer()).getGstState() != null) {
            boolean igstExpected = TaxCalculationHelper.isIGSTApplicable(
                CustomerAddressUtils.getDefaultAddress(invoice.getCustomer()).getGstState().getStateName(),
                invoice.getPlaceOfSupplyStateCode());

            if (igstExpected && request.getIgstAmount() == null) {
                log.debug("Place of supply indicates IGST but request did not include IGST amount");
            }

            if (!igstExpected && request.getIgstAmount() != null && request.getIgstAmount().compareTo(BigDecimal.ZERO) > 0) {
                throw new InvalidTaxCalculationException(
                        "IGST should not be applied for intra-state place of supply", "INVALID_IGST_FOR_PLACE_OF_SUPPLY");
            }

            if (igstExpected && ((request.getCgstAmount() != null && request.getCgstAmount().compareTo(BigDecimal.ZERO) > 0) ||
                    (request.getSgstAmount() != null && request.getSgstAmount().compareTo(BigDecimal.ZERO) > 0))) {
                throw new InvalidTaxCalculationException(
                        "CGST/SGST should not be applied for inter-state place of supply", "INVALID_CGST_SGST_FOR_PLACE_OF_SUPPLY");
            }
        }
    }

    private void scaleTaxAmounts(InvoiceTax entity) {
        entity.setTaxableAmount(scaleValue(entity.getTaxableAmount()));
        entity.setCgstAmount(scaleValue(entity.getCgstAmount()));
        entity.setSgstAmount(scaleValue(entity.getSgstAmount()));
        entity.setIgstAmount(scaleValue(entity.getIgstAmount()));
        entity.setCessAmount(scaleValue(entity.getCessAmount()));
    }

    private BigDecimal scaleValue(BigDecimal value) {
        return value == null ? null : value.setScale(4, RoundingMode.HALF_UP);
    }
}
