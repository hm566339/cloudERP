package com.erp.account.modules.paymentvoucher.dto.response.profile;

import com.erp.account.enums.PostingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlPostingDto {
    private UUID journalEntryId;
    private String journalNumber;
    private PostingStatus postingStatus;
    private LocalDateTime postingDate;
    private UUID postedBy;
    private List<GlJournalLineDto> debitEntries;
    private List<GlJournalLineDto> creditEntries;
}
