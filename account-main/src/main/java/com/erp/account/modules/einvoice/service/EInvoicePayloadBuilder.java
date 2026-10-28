package com.erp.account.modules.einvoice.service;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCanonicalPayload;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class EInvoicePayloadBuilder {

    public EInvoiceCanonicalPayload build(SalesInvoice invoice, GstRegistration supplierReg) {
        Company company = invoice.getCompany();
        Customer customer = invoice.getCustomer();

        // 1. Seller Details
        String sellerStateCode = supplierReg.getStateCode() != null ? supplierReg.getStateCode().getStateCode() : "27";
        if (!StringUtils.hasText(sellerStateCode) && supplierReg.getGstin() != null && supplierReg.getGstin().length() >= 2) {
            sellerStateCode = supplierReg.getGstin().substring(0, 2);
        }

        EInvoiceCanonicalPayload.SellerDetails seller = EInvoiceCanonicalPayload.SellerDetails.builder()
                .gstin(supplierReg.getGstin())
                .legalName(StringUtils.hasText(supplierReg.getLegalName()) ? supplierReg.getLegalName() : (company != null ? company.getCompanyName() : "Seller"))
                .tradeName(supplierReg.getTradeName())
                .address1(company != null && StringUtils.hasText(company.getAddressLine1()) ? company.getAddressLine1() : "Business Address")
                .address2(company != null ? company.getAddressLine2() : null)
                .location(company != null && StringUtils.hasText(company.getCity()) ? company.getCity() : "City")
                .pincode(company != null && StringUtils.hasText(company.getPostalCode()) ? company.getPostalCode() : "400001")
                .stateCode(sellerStateCode)
                .phone(company != null ? company.getPhone() : null)
                .email(company != null ? company.getEmail() : null)
                .build();

        // 2. Buyer Details
        String buyerGstin = customer != null ? customer.getGstin() : null;
        String buyerStateCode = invoice.getBillingStateCode();
        if (!StringUtils.hasText(buyerStateCode) && StringUtils.hasText(buyerGstin) && buyerGstin.length() >= 2) {
            buyerStateCode = buyerGstin.substring(0, 2);
        }
        if (!StringUtils.hasText(buyerStateCode)) {
            buyerStateCode = sellerStateCode;
        }

        String pos = invoice.getPlaceOfSupplyStateCode();
        if (!StringUtils.hasText(pos)) {
            pos = buyerStateCode;
        }

        EInvoiceCanonicalPayload.BuyerDetails buyer = EInvoiceCanonicalPayload.BuyerDetails.builder()
                .gstin(buyerGstin)
                .legalName(customer != null && StringUtils.hasText(customer.getCustomerName()) ? customer.getCustomerName() : "Buyer")
                .tradeName(null)
                .placeOfSupply(pos)
                .address1(StringUtils.hasText(invoice.getBillingAddressLine1()) ? invoice.getBillingAddressLine1() : "Billing Address")
                .address2(invoice.getBillingAddressLine2())
                .location(StringUtils.hasText(invoice.getBillingCity()) ? invoice.getBillingCity() : "City")
                .pincode(StringUtils.hasText(invoice.getBillingPostalCode()) ? invoice.getBillingPostalCode() : "400001")
                .stateCode(buyerStateCode)
                .phone(customer != null ? customer.getPhone() : null)
                .email(customer != null ? customer.getEmail() : null)
                .build();

        // 3. Line Items
        List<EInvoiceCanonicalPayload.ItemDetails> items = new ArrayList<>();
        int serial = 1;
        BigDecimal sumTaxable = BigDecimal.ZERO;
        BigDecimal sumCgst = BigDecimal.ZERO;
        BigDecimal sumSgst = BigDecimal.ZERO;
        BigDecimal sumIgst = BigDecimal.ZERO;
        BigDecimal sumCess = BigDecimal.ZERO;

        if (invoice.getSalesInvoiceItems() != null) {
            for (SalesInvoiceItem item : invoice.getSalesInvoiceItems()) {
                if (item.getIsDeleted() != null && item.getIsDeleted()) {
                    continue;
                }

                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal gross = qty.multiply(unitPrice);
                BigDecimal disc = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal taxable = item.getTaxableAmount() != null ? item.getTaxableAmount() : gross.subtract(disc);
                BigDecimal cgst = item.getCgstAmount() != null ? item.getCgstAmount() : BigDecimal.ZERO;
                BigDecimal sgst = item.getSgstAmount() != null ? item.getSgstAmount() : BigDecimal.ZERO;
                BigDecimal igst = item.getIgstAmount() != null ? item.getIgstAmount() : BigDecimal.ZERO;
                BigDecimal cess = item.getCessAmount() != null ? item.getCessAmount() : BigDecimal.ZERO;
                BigDecimal itemTotal = item.getTotalAmount() != null ? item.getTotalAmount() : taxable.add(cgst).add(sgst).add(igst).add(cess);

                sumTaxable = sumTaxable.add(taxable);
                sumCgst = sumCgst.add(cgst);
                sumSgst = sumSgst.add(sgst);
                sumIgst = sumIgst.add(igst);
                sumCess = sumCess.add(cess);

                String hsn = (item.getHsnSacMaster() != null && StringUtils.hasText(item.getHsnSacMaster().getCode()))
                        ? item.getHsnSacMaster().getCode()
                        : "84713010";

                BigDecimal rate = BigDecimal.ZERO;
                if (item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null) {
                    var slab = item.getHsnSacMaster().getGstSlab();
                    if (slab.getIgstRate() != null && slab.getIgstRate().compareTo(BigDecimal.ZERO) > 0) {
                        rate = slab.getIgstRate();
                    } else if (slab.getCgstRate() != null) {
                        rate = slab.getCgstRate().add(slab.getSgstRate() != null ? slab.getSgstRate() : BigDecimal.ZERO);
                    }
                }
                if (rate.compareTo(BigDecimal.ZERO) == 0 && taxable.compareTo(BigDecimal.ZERO) > 0 && item.getTaxAmount() != null) {
                    rate = item.getTaxAmount().multiply(new BigDecimal("100")).divide(taxable, 2, java.math.RoundingMode.HALF_UP);
                }

                items.add(EInvoiceCanonicalPayload.ItemDetails.builder()
                        .itemSerialNo(String.valueOf(serial++))
                        .productDescription(StringUtils.hasText(item.getDescription()) ? item.getDescription() : (StringUtils.hasText(item.getItemName()) ? item.getItemName() : "Item " + serial))
                        .isService(hsn.startsWith("99") ? "Y" : "N")
                        .hsnCode(hsn)
                        .quantity(qty)
                        .unitOfMeasurement(StringUtils.hasText(item.getUnit()) ? item.getUnit() : "NOS")
                        .unitPrice(unitPrice)
                        .totalAmount(gross)
                        .discount(disc)
                        .taxableAmount(taxable)
                        .gstRate(rate)
                        .cgstAmount(cgst)
                        .sgstAmount(sgst)
                        .igstAmount(igst)
                        .cessAmount(cess)
                        .totalItemValue(itemTotal)
                        .build());
            }
        }

        // 4. Value Details
        EInvoiceCanonicalPayload.ValueDetails values = EInvoiceCanonicalPayload.ValueDetails.builder()
                .totalTaxableAmount(sumTaxable)
                .totalCgstAmount(sumCgst)
                .totalSgstAmount(sumSgst)
                .totalIgstAmount(sumIgst)
                .totalCessAmount(sumCess)
                .totalDiscount(BigDecimal.ZERO)
                .otherCharges(invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO)
                .roundOffAmount(invoice.getRoundOff() != null ? invoice.getRoundOff() : BigDecimal.ZERO)
                .totalInvoiceValue(invoice.getTotalAmount())
                .build();

        return EInvoiceCanonicalPayload.builder()
                .version("1.04")
                .docType("INV")
                .docNumber(invoice.getInvoiceNumber())
                .docDate(invoice.getInvoiceDate())
                .taxScheme("GST")
                .supplyType("B2B")
                .reverseCharge("N")
                .igstOnIntra("N")
                .seller(seller)
                .buyer(buyer)
                .items(items)
                .values(values)
                .build();
    }
}
