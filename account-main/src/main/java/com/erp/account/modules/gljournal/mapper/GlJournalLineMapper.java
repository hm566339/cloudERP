package com.erp.account.modules.gljournal.mapper;

import com.erp.account.modules.gljournal.dto.response.GlJournalLineResponse;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface GlJournalLineMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "journalEntry", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "account", ignore = true)
    GlJournalLine requestToEntity(GlJournalLineRequest request);

    @Mapping(source = "journalEntry.id", target = "journalEntryId")
    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "journalEntry.voucherDate", target = "voucherDate")
    @Mapping(source = "journalEntry.voucherNo", target = "voucherNo")
    @Mapping(source = "account.id", target = "accountId")
    @Mapping(source = "account.accountCode", target = "accountCode")
    @Mapping(source = "account.accountName", target = "accountName")
    @Mapping(target = "baseAmount", expression = "java(calculateBaseAmount(entity))")
    GlJournalLineResponse entityToResponse(GlJournalLine entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "journalEntry", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateEntityFromRequest(GlJournalLineRequest request, @MappingTarget GlJournalLine entity);

    List<GlJournalLineResponse> entityListToResponseList(List<GlJournalLine> entities);

    default java.math.BigDecimal calculateBaseAmount(GlJournalLine line) {
        java.math.BigDecimal amount = line.getAmount();
        if (line.getExchangeRate() != null && line.getExchangeRate().compareTo(java.math.BigDecimal.ONE) != 0) {
            return amount.multiply(line.getExchangeRate());
        }
        return amount;
    }
}
