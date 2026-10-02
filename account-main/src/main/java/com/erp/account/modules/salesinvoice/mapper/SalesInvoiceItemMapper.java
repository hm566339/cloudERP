package com.erp.account.modules.salesinvoice.mapper;

import com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceItemResponse;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import org.mapstruct.*;

import java.util.List;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;


/**
 * MapStruct Mapper for SalesInvoiceItem
 * 
 * Handles bidirectional mapping between:
 * - SalesInvoiceItem (JPA Entity)
 * - SalesInvoiceItemRequest (API Request DTO)
 * - SalesInvoiceItemResponse (API Response DTO)
 * 
 * Features:
 * - Null value handling strategy: IGNORE
 * - Field-level mapping with @Mapping annotations
 * - Ignores ID, relationships, and audit fields for request mapping
 * - Supports bulk mapping with entityListToResponseList
 * 
 * @author ERP System
 * @since 1.0.0
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class},
    builder = @org.mapstruct.Builder(disableBuilder = true)
)
public interface SalesInvoiceItemMapper {

    /**
     * Maps JPA entity to API response DTO
     * Includes HSN/SAC code from related entity
     * 
     * @param item SalesInvoiceItem entity
     * @return SalesInvoiceItemResponse DTO
     */
    @Mapping(source = "hsnSacMaster.code", target = "hsnSacCode")
    @Mapping(source = "hsnSacMaster.id", target = "hsnSacId")
    @Mapping(source = "salesInvoice.id", target = "salesInvoiceId")
    @Mapping(source = "hsnSacMaster.gstSlab.cgstRate", target = "cgstPercentage")
    @Mapping(source = "hsnSacMaster.gstSlab.sgstRate", target = "sgstPercentage")
    @Mapping(source = "hsnSacMaster.gstSlab.igstRate", target = "igstPercentage")
    @Mapping(source = "hsnSacMaster.gstSlab.igstRate", target = "taxRate")
    SalesInvoiceItemResponse entityToResponse(SalesInvoiceItem item);

    @AfterMapping
    default void populateTaxBreakdown(SalesInvoiceItem item, @MappingTarget SalesInvoiceItemResponse response) {
        if (item == null || response == null) return;

        if (item.getIgstAmount() != null && item.getIgstAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            response.setCgstPercentage(java.math.BigDecimal.ZERO);
            response.setSgstPercentage(java.math.BigDecimal.ZERO);
        } else if ((item.getCgstAmount() != null && item.getCgstAmount().compareTo(java.math.BigDecimal.ZERO) > 0) ||
                   (item.getSgstAmount() != null && item.getSgstAmount().compareTo(java.math.BigDecimal.ZERO) > 0)) {
            response.setIgstPercentage(java.math.BigDecimal.ZERO);
        }
    }

    /**
     * Maps API request DTO to JPA entity
     * Ignores generated fields, relationships, and audit information
     * 
     * @param request SalesInvoiceItemRequest DTO
     * @return SalesInvoiceItem entity (without ID, company, invoice, and audit fields)
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoice", ignore = true)
    @Mapping(target = "hsnSacMaster", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    SalesInvoiceItem requestToEntity(SalesInvoiceItemRequest request);

    /**
     * Updates existing entity from API request DTO
     * Preserves ID, relationships, and audit information
     * 
     * @param request SalesInvoiceItemRequest DTO
     * @param item SalesInvoiceItem entity to update (target)
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoice", ignore = true)
    @Mapping(target = "hsnSacMaster", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "totalAmount", ignore = true)
    void updateEntityFromRequest(SalesInvoiceItemRequest request, @MappingTarget SalesInvoiceItem item);

    /**
     * Converts list of entities to list of response DTOs
     * 
     * @param items List of SalesInvoiceItem entities
     * @return List of SalesInvoiceItemResponse DTOs
     */
    List<SalesInvoiceItemResponse> entityListToResponseList(List<SalesInvoiceItem> items);

    /**
     * Converts list of request DTOs to list of entities
     * 
     * @param requests List of SalesInvoiceItemRequest DTOs
     * @return List of SalesInvoiceItem entities
     */
    List<SalesInvoiceItem> requestListToEntityList(List<SalesInvoiceItemRequest> requests);
}
