package com.erp.account.modules.vendor.mapper;

import com.erp.account.modules.vendor.dto.request.VendorRequest;
import com.erp.account.modules.vendor.dto.response.VendorResponse;
import com.erp.account.modules.vendor.entity.Vendor;
import org.mapstruct.*;
import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface VendorMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.companyName")
    @Mapping(target = "payableAccountId", source = "payableAccount.id")
    @Mapping(target = "payableAccountCode", source = "payableAccount.accountCode")
    @Mapping(target = "payableAccountName", source = "payableAccount.accountName")
    @Mapping(target = "currencyCode", source = "defaultCurrency")
    @Mapping(target = "currencyName", expression = "java(currencyName(vendor.getDefaultCurrency()))")
    @Mapping(target = "paymentTerm", expression = "java(paymentTermLabel(vendor.getPaymentTermDays()))")
    VendorResponse entityToResponse(Vendor vendor);

    @Mapping(target = "payableAccount", ignore = true)
    Vendor requestToEntity(VendorRequest request);

    @Mapping(target = "payableAccount", ignore = true)
    void updateEntityFromRequest(VendorRequest request, @MappingTarget Vendor vendor);

    List<VendorResponse> entityListToResponseList(List<Vendor> vendors);

    default String paymentTermLabel(Integer paymentTermDays) {
        return paymentTermDays == null ? null : paymentTermDays + " days";
    }

    default String currencyName(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            return null;
        }
        try {
            return java.util.Currency.getInstance(currencyCode).getDisplayName();
        } catch (IllegalArgumentException ex) {
            return currencyCode;
        }
    }
}
