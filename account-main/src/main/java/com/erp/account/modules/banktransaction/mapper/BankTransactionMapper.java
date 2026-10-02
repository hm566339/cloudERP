package com.erp.account.modules.banktransaction.mapper;

import com.erp.account.modules.banktransaction.dto.BankTransactionRequest;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionResponse;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

/**
 * MapStruct Mapper for BankTransaction Entity and DTOs
 * 
 * Maps between:
 * - BankTransactionRequest -> BankTransaction Entity
 * - BankTransaction Entity -> BankTransactionResponse
 * - Update operations
 * 
 * @author ERP System
 * @version 1.0
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class},
    builder = @Builder(disableBuilder = true)
)
public interface BankTransactionMapper {

    /**
     * Maps BankTransactionRequest DTO to BankTransaction Entity
     * 
     * @param request the request DTO
     * @return the entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "reconciledDate", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    BankTransaction requestToEntity(BankTransactionRequest request);

    /**
     * Maps BankTransaction Entity to BankTransactionResponse DTO
     * 
     * @param entity the entity
     * @return the response DTO
     */
    @Mapping(source = "company.id", target = "companyId")
    @Mapping(target = "transactionAmount", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glStatus", ignore = true)
    @Mapping(target = "runningBalance", ignore = true)
    @Mapping(target = "reconciledDate", ignore = true)
    BankTransactionResponse entityToResponse(BankTransaction entity);

    /**
     * Maps list of entities to list of response DTOs
     * 
     * @param entities the entities list
     * @return the response DTOs list
     */
    List<BankTransactionResponse> entityListToResponseList(List<BankTransaction> entities);

    /**
     * Updates existing entity from request DTO
     * 
     * Ignores id, company, bankAccount, timestamps, and audit fields
     * 
     * @param request the request DTO
     * @param entity the entity to update
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "reconciledDate", ignore = true)
    @Mapping(target = "glJournalEntryId", ignore = true)
    @Mapping(target = "glPostingStatus", ignore = true)
    void updateEntityFromRequest(BankTransactionRequest request, @MappingTarget BankTransaction entity);
}
