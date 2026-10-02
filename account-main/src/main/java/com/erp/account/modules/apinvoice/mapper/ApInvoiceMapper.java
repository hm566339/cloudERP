package com.erp.account.modules.apinvoice.mapper;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

/**
 * MapStruct Mapper for ApInvoice
 * 
 * Handles conversion between:
 * - ApInvoice entity <-> ApInvoiceRequest DTO
 * - ApInvoice entity <-> ApInvoiceResponse DTO
 * - List conversions
 * 
 * Null values are ignored during mapping to preserve existing data
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, ApInvoiceItemMapper.class}
)
public interface ApInvoiceMapper {

    // ============================================================
    // REQUEST TO ENTITY MAPPINGS
    // ============================================================

    /**
     * Convert ApInvoiceRequest DTO to ApInvoice entity
     * 
     * Maps nested items collection using ApInvoiceItemMapper
     * 
     * @param request Request DTO
     * @return ApInvoice entity
     */
    @Mapping(target = "items", source = "items")
    @Mapping(target = "vendor", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "id", ignore = true)
    ApInvoice requestToEntity(ApInvoiceRequest request);

    // ============================================================
    // ENTITY TO RESPONSE MAPPINGS
    // ============================================================

    /**
     * Convert ApInvoice entity to ApInvoiceResponse DTO
     * 
     * Maps vendor and company details from lazy-loaded relationships
     * Calculates derived fields like payment percentage and days overdue
     * Formats timestamps
     * 
     * @param entity ApInvoice entity
     * @return Response DTO
     */
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.companyName")
    @Mapping(target = "vendorId", source = "vendor.id")
    @Mapping(target = "vendorCode", source = "vendor.vendorCode")
    @Mapping(target = "vendorName", source = "vendor.vendorName")
    @Mapping(target = "vendorGstin", source = "vendor.gstin")
    @Mapping(target = "vendorPan", source = "vendor.panNo")
    @Mapping(target = "items", source = "items")
    @Mapping(target = "createdAt", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @Mapping(target = "updatedAt", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @Mapping(target = "approvedAt", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @Mapping(target = "daysOverdue", ignore = true)
    @Mapping(target = "paymentPercentage", ignore = true)
    @Mapping(target = "itemCount", ignore = true)
    @Mapping(target = "approvalStatus", ignore = true)
    @Mapping(target = "editable", ignore = true)
    @Mapping(target = "deletable", ignore = true)
    @Mapping(target = "approvable", ignore = true)
    @Mapping(target = "postable", ignore = true)
    @Mapping(target = "payable", ignore = true)
    @Mapping(target = "baseCurrencyTotal", ignore = true)
    ApInvoiceResponse entityToResponse(ApInvoice entity);

    // ============================================================
    // UPDATE ENTITY FROM REQUEST
    // ============================================================

    /**
     * Update existing ApInvoice entity with values from request
     * Null values in request are ignored
     * 
     * Does not update immutable fields like id, company, vendor
     * 
     * @param request Request DTO
     * @param entity Target entity to update
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "vendor", ignore = true)
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    void updateEntityFromRequest(ApInvoiceRequest request, @MappingTarget ApInvoice entity);

    // ============================================================
    // LIST MAPPINGS
    // ============================================================

    /**
     * Convert list of ApInvoiceRequest to list of ApInvoice entities
     * 
     * @param requests List of request DTOs
     * @return List of entities
     */
    List<ApInvoice> requestListToEntityList(List<ApInvoiceRequest> requests);

    /**
     * Convert list of ApInvoice entities to list of response DTOs
     * 
     * @param entities List of entities
     * @return List of response DTOs
     */
    List<ApInvoiceResponse> entityListToResponseList(List<ApInvoice> entities);
}
