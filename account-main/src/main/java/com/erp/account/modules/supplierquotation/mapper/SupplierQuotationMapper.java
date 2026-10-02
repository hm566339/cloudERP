package com.erp.account.modules.supplierquotation.mapper;

import com.erp.account.modules.supplierquotation.dto.SupplierQuotationResponse;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotation;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotationItem;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class SupplierQuotationMapper {

    @Autowired
    protected VendorRepository vendorRepository;

    @Mapping(target = "vendorName", expression = "java(resolveVendorName(q))")
    @Mapping(target = "rfqNumber", source = "rfq.rfqNumber")
    public abstract SupplierQuotationResponse toResponse(SupplierQuotation q);

    public abstract SupplierQuotationResponse.Item toItemResponse(SupplierQuotationItem item);

    protected String resolveVendorName(SupplierQuotation q) {
        if (q == null) return null;
        try {
            if (q.getVendor() != null && q.getVendor().getVendorName() != null) {
                return q.getVendor().getVendorName();
            }
        } catch (Exception ignored) {
        }
        if (q.getVendorId() != null) {
            return vendorRepository.findById(q.getVendorId())
                    .map(Vendor::getVendorName)
                    .orElse(null);
        }
        return null;
    }
}
