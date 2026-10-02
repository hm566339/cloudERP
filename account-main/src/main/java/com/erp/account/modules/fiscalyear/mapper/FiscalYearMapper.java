package com.erp.account.modules.fiscalyear.mapper;

import com.erp.account.modules.fiscalyear.dto.request.FiscalYearRequest;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponse;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface FiscalYearMapper {

    @Mapping(source = "fiscalYear", target = "fiscalYear")
    @Mapping(source = "isClosed", target = "status")
    FiscalYear toEntity(FiscalYearRequest fiscalYearRequest);

    @Mapping(source = "fiscalYear", target = "fiscalYear")
    @Mapping(source = "status", target = "isClosed")
    FiscalYearRequest toDto(FiscalYear fiscalYear);

    @Mapping(source = "fiscalYear", target = "fiscalYear")
    @Mapping(source = "isClosed", target = "status")
    void updateEntity(
            FiscalYearRequest fiscalYearRequest,
            @MappingTarget FiscalYear fiscalYear);

    @Mapping(source = "fiscalYear", target = "fiscalYear")
    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "company.companyName", target = "companyName")
    @Mapping(source = "status", target = "isClosed")
    FiscalYearResponse toResponse(FiscalYear fiscalYear);

    default FiscalYearStatus mapBooleanToStatus(Boolean isClosed) {
        return Boolean.TRUE.equals(isClosed) ? FiscalYearStatus.CLOSED : FiscalYearStatus.OPEN;
    }

    default Boolean mapStatusToBoolean(FiscalYearStatus status) {
        return status != null && !FiscalYearStatus.OPEN.equals(status);
    }
}
