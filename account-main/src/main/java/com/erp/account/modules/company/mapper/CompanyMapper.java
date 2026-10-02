package com.erp.account.modules.company.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.company.dto.request.CompanyRequest;
import com.erp.account.modules.company.entity.Company;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface CompanyMapper {

    /**
     * Convert Request DTO to Entity
     */
    Company toEntity(CompanyRequest request);

    /**
     * Convert Entity to Response DTO
     */
    CompanyResponse toResponse(Company company);

    /**
     * Update existing entity from request DTO
     */
    void updateEntity(CompanyRequest request,
            @MappingTarget Company company);
}
