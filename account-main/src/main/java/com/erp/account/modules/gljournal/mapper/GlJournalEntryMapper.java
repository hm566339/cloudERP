package com.erp.account.modules.gljournal.mapper;

import com.erp.account.modules.gljournal.dto.response.GlJournalEntryListResponse;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import org.mapstruct.*;

import java.util.List;
import java.util.Set;

/**
 * MapStruct Mapper for GL Journal Entry/Line DTOs
 * 
 * Handles bidirectional mapping between:
 * - GlJournalEntry <-> GlJournalEntryRequest/Response
 * 
 * Features:
 * - Nested mapping for relationships
 * - Calculated field mapping (baseAmount, isBalanced)
 * - Null safety with IGNORE strategy
 * - Component-scoped Spring bean
 * 
 * @author ERP Team
 * @version 1.0
 */
@Mapper(
        componentModel = "spring",
        uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class, GlJournalLineMapper.class},
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        injectionStrategy = InjectionStrategy.CONSTRUCTOR)
public interface GlJournalEntryMapper {

    // ============================================================
    // JOURNAL ENTRY MAPPINGS
    // ============================================================

    /**
     * Convert Request DTO to Entity
     * Maps company, fiscal year, period from IDs
     * Sets status to DRAFT by default
     * 
     * @param request GlJournalEntryRequest
     * @return GlJournalEntry entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "journalLines", ignore = true)
    @Mapping(target = "hashValue", ignore = true)
    @Mapping(target = "previousHash", ignore = true)
    @Mapping(target = "hashAlgorithm", constant = "SHA-256")
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "postedAt", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "fiscalYear", ignore = true)
    @Mapping(target = "accountingPeriod", ignore = true)
    @Mapping(target = "totalDebit", ignore = true)
    @Mapping(target = "totalCredit", ignore = true)
    GlJournalEntry requestToEntity(GlJournalEntryRequest request);

    /**
     * Convert Entity to Response DTO
     * Maps calculated fields: isBalanced, lineCount, debitLineCount,
     * creditLineCount
     * 
     * @param entity GlJournalEntry
     * @return GlJournalEntryResponse
     */
    @Mapping(target = "isBalanced", expression = "java(entity.isBalanced())")
    @Mapping(target = "lineCount", expression = "java(entity.getLineCount())")
    @Mapping(target = "debitLineCount", expression = "java(entity.getDebitLineCount())")
    @Mapping(target = "creditLineCount", expression = "java(entity.getCreditLineCount())")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.companyName")
    @Mapping(target = "fiscalYearId", source = "fiscalYear.id")
    @Mapping(target = "fiscalYearValue", source = "fiscalYear.fiscalYear")
    @Mapping(target = "accountingPeriodId", source = "accountingPeriod.id")
    @Mapping(target = "periodName", source = "accountingPeriod.periodName")
    GlJournalEntryResponse entityToResponse(GlJournalEntry entity);

    /**
     * Convert Entity to List Response DTO (lightweight)
     * Excludes detailed lines and hash information
     * 
     * @param entity GlJournalEntry
     * @return GlJournalEntryListResponse
     */
    @Mapping(target = "isBalanced", expression = "java(entity.isBalanced())")
    @Mapping(target = "lineCount", expression = "java(entity.getLineCount())")
    @Mapping(target = "companyName", source = "company.companyName")
    @Mapping(target = "narration", expression = "java(truncateNarration(entity.getNarration()))")
    @Mapping(target = "postedAt", expression = "java(formatDateTime(entity.getPostedAt()))")
    @Mapping(target = "createdAt", expression = "java(formatDateTime(entity.getCreatedAt()))")
    GlJournalEntryListResponse entityToListResponse(GlJournalEntry entity);

    /**
     * Update entity from request (for PUT operations)
     * Ignores: id, status, hash fields, post info, timestamps
     * 
     * @param request GlJournalEntryRequest
     * @param entity  GlJournalEntry to update
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "journalLines", ignore = true)
    @Mapping(target = "hashValue", ignore = true)
    @Mapping(target = "previousHash", ignore = true)
    @Mapping(target = "hashAlgorithm", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "postedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    void updateEntityFromRequest(GlJournalEntryRequest request, @MappingTarget GlJournalEntry entity);

    /**
     * Convert list of entities to responses
     * 
     * @param entities list of GlJournalEntry
     * @return list of GlJournalEntryResponse
     */
    List<GlJournalEntryResponse> entitiesToResponses(List<GlJournalEntry> entities);

    /**
     * Convert list of entities to list responses
     * 
     * @param entities list of GlJournalEntry
     * @return list of GlJournalEntryListResponse
     */
    List<GlJournalEntryListResponse> entitiesToListResponses(List<GlJournalEntry> entities);

    /**
     * Convert set of entities to responses
     * 
     * @param entities set of GlJournalEntry
     * @return list of GlJournalEntryResponse
     */
    List<GlJournalEntryResponse> entitiesToResponses(Set<GlJournalEntry> entities);

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Helper: Truncate narration to 100 characters
     * 
     * @param narration original text
     * @return truncated text with ellipsis if needed
     */
    default String truncateNarration(String narration) {
        if (narration == null)
            return null;
        if (narration.length() > 100) {
            return narration.substring(0, 97) + "...";
        }
        return narration;
    }

    /**
     * Helper: Format LocalDateTime to ISO string
     * 
     * @param dateTime LocalDateTime
     * @return ISO formatted string or null
     */
    default String formatDateTime(java.time.LocalDateTime dateTime) {
        if (dateTime == null)
            return null;
        return dateTime.toString();
    }

    /**
     * Helper: Format LocalDateTime to ISO string
     * 
     * @param instant Instant
     * @return ISO formatted string or null
     */
    default String formatDateTime(java.time.Instant instant) {
        if (instant == null)
            return null;
        return instant.toString();
    }
}
