package com.erp.account.modules.salesinvoice.mapper;

import com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import org.mapstruct.*;

import java.util.List;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;


/**
 * MapStruct Mapper for SalesInvoice
 * 
 * Handles bidirectional mapping between:
 * - SalesInvoice (JPA Entity)
 * - SalesInvoiceRequest (API Request DTO)
 * - SalesInvoiceResponse (API Response DTO)
 * 
 * Features:
 * - Null value handling strategy: IGNORE
 * - Field-level mapping with @Mapping annotations
 * - Ignores ID, relationships, and audit fields for request mapping
 * - Extracts nested object properties (Company, Customer) for response mapping
 * - Supports bulk mapping with entityListToResponseList
 * 
 * @author ERP System
 * @since 1.0.0
 */
@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class,  SalesInvoiceItemMapper.class }
)
public abstract class SalesInvoiceMapper {

    @org.springframework.beans.factory.annotation.Autowired
    protected com.erp.account.modules.gst.repository.GstRegistrationRepository gstRegistrationRepository;

    /**
     * Maps JPA entity to API response DTO
     * Extracts company and customer details for comprehensive response
     * 
     * @param invoice SalesInvoice entity
     * @return SalesInvoiceResponse DTO
     */
    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "company.companyName", target = "companyName")
    @Mapping(source = "company.gstin", target = "companyGstin")
    @Mapping(source = "company.baseCurrency", target = "companyBaseCurrency")
    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.customerCode", target = "customerCode")
    @Mapping(source = "customer.customerName", target = "customerName")
    @Mapping(source = "customer.gstin", target = "customerGstin")
    @Mapping(source = "customer.email", target = "customerEmail")
    @Mapping(source = "customer.phone", target = "customerPhone")
    @Mapping(source = "billingAddressLine1", target = "customerAddress")
    @Mapping(source = "billingCity", target = "customerCity")
    @Mapping(source = "billingState", target = "customerState")
    @Mapping(source = "billingCountry", target = "customerCountry")
    @Mapping(source = "billingStateCode", target = "customerStateCode")
    @Mapping(source = "salesInvoiceItems", target = "lineItems")
    @Mapping(source = "notes", target = "remarks")
    @Mapping(source = "outstandingAmount", target = "eligibleCreditAmount")
    @Mapping(source = "sourceSalesOrderId", target = "salesOrderId")
    @Mapping(source = "sourceSalesOrderNumber", target = "salesOrderNumber")
    @Mapping(source = "sourceDeliveryChallanId", target = "deliveryChallanId")
    @Mapping(source = "sourceDeliveryChallanNumber", target = "deliveryChallanNumber")
    public abstract SalesInvoiceResponse entityToResponse(SalesInvoice invoice);

    /**
     * Maps API request DTO to JPA entity
     * Ignores generated fields, relationships, and audit information
     * 
     * @param request SalesInvoiceRequest DTO
     * @return SalesInvoice entity (without ID, relationships, and audit fields)
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "salesInvoiceItems", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "postedAt", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    public abstract SalesInvoice requestToEntity(SalesInvoiceRequest request);

    /**
     * Updates existing entity from API request DTO
     * Preserves ID, relationships, and audit information
     * 
     * @param request SalesInvoiceRequest DTO
     * @param invoice SalesInvoice entity to update (target)
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "companyId", ignore = true)
    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "salesInvoiceItems", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "postedAt", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    public abstract void updateEntityFromRequest(SalesInvoiceRequest request, @MappingTarget SalesInvoice invoice);

    /**
     * Converts list of entities to list of response DTOs
     * 
     * @param invoices List of SalesInvoice entities
     * @return List of SalesInvoiceResponse DTOs
     */
    public abstract List<SalesInvoiceResponse> entityListToResponseList(List<SalesInvoice> invoices);

    @AfterMapping
    protected void calculateReportingFields(SalesInvoice invoice, @MappingTarget SalesInvoiceResponse response) {
        if (invoice == null || response == null) return;

        java.math.BigDecimal total = invoice.getTotalAmount();
        java.math.BigDecimal received = invoice.getReceivedAmount();
        
        if (total != null && total.compareTo(java.math.BigDecimal.ZERO) > 0) {
            java.math.BigDecimal percent = com.erp.account.util.InvoiceCalculationHelper.calculatePaymentPercentage(received, total);
            // Ensure payment percentage is capped between 0 and 100
            if (percent.compareTo(new java.math.BigDecimal("100")) > 0) {
                percent = new java.math.BigDecimal("100");
            } else if (percent.compareTo(java.math.BigDecimal.ZERO) < 0) {
                percent = java.math.BigDecimal.ZERO;
            }
            response.setPaymentPercentage(percent);
        } else {
            response.setPaymentPercentage(java.math.BigDecimal.ZERO);
        }
        
        if (invoice.getDueDate() != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            long days = java.time.temporal.ChronoUnit.DAYS.between(invoice.getDueDate(), today);
            
            if (days > 0 && invoice.getOutstandingAmount() != null && invoice.getOutstandingAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                response.setIsOverdue(true);
                response.setDaysOutstanding((int) days);
                
                if (days <= 30) response.setAgingBucket("0-30");
                else if (days <= 60) response.setAgingBucket("31-60");
                else if (days <= 90) response.setAgingBucket("61-90");
                else response.setAgingBucket("90+");
            } else {
                response.setIsOverdue(false);
                response.setDaysOutstanding(0);
                response.setAgingBucket("Current");
            }
        }
        
        if (total != null) {
            if (invoice.getExchangeRate() != null) {
                response.setBaseCurrencyAmount(total.multiply(invoice.getExchangeRate()).setScale(4, java.math.RoundingMode.HALF_UP));
            } else {
                response.setBaseCurrencyAmount(total);
            }
        }
    }

    @AfterMapping
    protected void resolveAddresses(SalesInvoice invoice, @MappingTarget SalesInvoiceResponse response) {
        if (invoice == null || response == null) return;
        
        // Resolve Company GST and State Code from GST Registration API (Database)
        if (invoice.getCompany() != null && invoice.getCompany().getId() != null) {
            String companyStateCode = "";
            String companyGstin = invoice.getCompany().getGstin() != null ? invoice.getCompany().getGstin() : "";
            
            try {
                java.util.Optional<com.erp.account.modules.gst.entity.GstRegistration> regOpt = gstRegistrationRepository
                        .findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(invoice.getCompany().getId());
                
                if (regOpt.isPresent()) {
                    com.erp.account.modules.gst.entity.GstRegistration reg = regOpt.get();
                    if (reg.getGstin() != null && !reg.getGstin().isEmpty()) {
                        companyGstin = reg.getGstin();
                    }
                    if (reg.getStateCode() != null && reg.getStateCode().getStateCode() != null) {
                        companyStateCode = reg.getStateCode().getStateCode();
                    }
                } else {
                    if (companyGstin.length() >= 2) {
                        companyStateCode = companyGstin.substring(0, 2);
                    }
                }
            } catch (Exception e) {
                if (companyGstin.length() >= 2) {
                    companyStateCode = companyGstin.substring(0, 2);
                }
            }
            
            response.setCompanyGstin(companyGstin);
            response.setCompanyStateCode(companyStateCode);
        }

        Customer customer = invoice.getCustomer();
        if (customer != null) {
            String fallbackAddress = com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer);
            String fallbackCity = com.erp.account.util.CustomerAddressUtils.getCity(customer);
            String fallbackState = com.erp.account.util.CustomerAddressUtils.getState(customer);
            String fallbackCountry = com.erp.account.util.CustomerAddressUtils.getCountry(customer);
            String fallbackPostalCode = null;
            String fallbackStateCode = null;

            if (customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
                com.erp.account.modules.customer.entity.CustomerAddress defaultAddr = customer.getAddresses().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                        .findFirst()
                        .orElse(customer.getAddresses().get(0));
                
                if (fallbackAddress == null || fallbackAddress.trim().isEmpty()) fallbackAddress = defaultAddr.getAddressLine1();
                if (fallbackCity == null || fallbackCity.trim().isEmpty()) fallbackCity = defaultAddr.getCity();
                if (fallbackState == null || fallbackState.trim().isEmpty()) {
                    fallbackState = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateName() : null;
                }
                if (fallbackCountry == null || fallbackCountry.trim().isEmpty()) fallbackCountry = defaultAddr.getCountry();
                fallbackPostalCode = defaultAddr.getPostalCode();
                fallbackStateCode = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateCode() : null;
            }

            if (response.getCustomerAddress() == null || response.getCustomerAddress().trim().isEmpty()) {
                response.setCustomerAddress(fallbackAddress);
            }
            if (response.getCustomerCity() == null || response.getCustomerCity().trim().isEmpty()) {
                response.setCustomerCity(fallbackCity);
            }
            if (response.getCustomerState() == null || response.getCustomerState().trim().isEmpty()) {
                response.setCustomerState(fallbackState);
            }
            if (response.getCustomerCountry() == null || response.getCustomerCountry().trim().isEmpty()) {
                response.setCustomerCountry(fallbackCountry);
            }
            if (response.getCustomerStateCode() == null || response.getCustomerStateCode().trim().isEmpty()) {
                response.setCustomerStateCode(fallbackStateCode);
            }

            if (response.getDeliveryAddressLine1() == null || response.getDeliveryAddressLine1().trim().isEmpty()) {
                response.setDeliveryAddressLine1(fallbackAddress);
            }
            if (response.getDeliveryCity() == null || response.getDeliveryCity().trim().isEmpty()) {
                response.setDeliveryCity(fallbackCity);
            }
            if (response.getDeliveryState() == null || response.getDeliveryState().trim().isEmpty()) {
                response.setDeliveryState(fallbackState);
            }
            if (response.getDeliveryCountry() == null || response.getDeliveryCountry().trim().isEmpty()) {
                response.setDeliveryCountry(fallbackCountry);
            }
            if (response.getDeliveryPostalCode() == null || response.getDeliveryPostalCode().trim().isEmpty()) {
                response.setDeliveryPostalCode(fallbackPostalCode);
            }
        }
    }
}
