package com.erp.auth_service.mapper;

import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.dto.response.ComapanyOpenResponse;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.model.Company;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CompanyMapper {

        // Request -> Entity
        Company toCompany(CompanyRequest request);

        // Entity -> Response

        CompanyResponse toCompanyResponse(Company company);

        // Entity List -> Response List
        List<CompanyResponse> toCompanyResponseList(List<Company> companies);

        // Update Existing Entity
        @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
        void updateCompanyFromRequest(
                        CompanyRequest request,
                        @MappingTarget Company company);

        @Mapping(target = "companyCode", source = "companyCode")
        @Mapping(target = "companyName", source = "companyName")
        ComapanyOpenResponse toCompanyOpenResponse(Company company);
}