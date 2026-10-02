package com.erp.account.modules.receiptvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RvJournalEntryDto {
    private UUID journalEntryId;
    private String journalNumber;
    private String postingStatus;
    private LocalDateTime postingDate;
    private String postedBy;
    private List<String> debitEntries;
    private List<String> creditEntries;
}
