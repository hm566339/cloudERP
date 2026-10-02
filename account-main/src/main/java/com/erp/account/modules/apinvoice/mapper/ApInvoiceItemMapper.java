package com.erp.account.modules.apinvoice.mapper;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemResponse;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;
import com.erp.account.modules.apinvoice.entity.ApInvoice;


/**
 * MapStruct Mapper for ApInvoiceItem
 * 
 * Handles conversion between:
 * - ApInvoiceItem entity <-> ApInvoiceItemRequest DTO
 * - ApInvoiceItem entity <-> ApInvoiceItemResponse DTO
 * - List conversions
 * 
 * Null values are ignored during mapping to preserve existing data
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface ApInvoiceItemMapper {

    // ============================================================
    // REQUEST TO ENTITY MAPPINGS
    // ============================================================

    /**
     * Convert ApInvoiceItemRequest DTO to ApInvoiceItem entity
     * 
     * @param request Request DTO
     * @return ApInvoiceItem entity
     */
    ApInvoiceItem requestToEntity(ApInvoiceItemRequest request);

    // ============================================================
    // ENTITY TO RESPONSE MAPPINGS
    // ============================================================

    /**
     * Convert ApInvoiceItem entity to ApInvoiceItemResponse DTO
     * 
     * @param entity ApInvoiceItem entity
     * @return Response DTO
     */
    @Mapping(target = "createdAt", dateFormat = "yyyy-MM-dd HH:mm:ss")
    @Mapping(target = "updatedAt", dateFormat = "yyyy-MM-dd HH:mm:ss")
    ApInvoiceItemResponse entityToResponse(ApInvoiceItem entity);

    // ============================================================
    // UPDATE ENTITY FROM REQUEST
    // ============================================================

    /**
     * Update existing ApInvoiceItem entity with values from request
     * Null values in request are ignored
     * 
     * @param request Request DTO
     * @param entity Target entity to update
     */
    void updateEntityFromRequest(ApInvoiceItemRequest request, @MappingTarget ApInvoiceItem entity);

    // ============================================================
    // LIST MAPPINGS
    // ============================================================

    /**
     * Convert list of ApInvoiceItemRequest to list of ApInvoiceItem entities
     * 
     * @param requests List of request DTOs
     * @return List of entities
     */
    List<ApInvoiceItem> requestListToEntityList(List<ApInvoiceItemRequest> requests);

    /**
     * Convert list of ApInvoiceItem entities to list of response DTOs
     * 
     * @param entities List of entities
     * @return List of response DTOs
     */
    List<ApInvoiceItemResponse> entityListToResponseList(List<ApInvoiceItem> entities);
}
