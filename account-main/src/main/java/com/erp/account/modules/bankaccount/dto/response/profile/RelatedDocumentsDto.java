package com.erp.account.modules.bankaccount.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatedDocumentsDto {
    private List<UUID> paymentVouchers;
    private List<UUID> receiptVouchers;
    private List<UUID> journalEntries;
    private List<UUID> bankCharges;
    private List<UUID> interestEntries;
    private List<UUID> bankStatements;
}
