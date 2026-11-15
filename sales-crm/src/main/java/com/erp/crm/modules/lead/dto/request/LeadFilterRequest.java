package com.erp.crm.modules.lead.dto.request;

import com.erp.crm.modules.lead.enums.LeadRating;
import com.erp.crm.modules.lead.enums.LeadStage;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadFilterRequest {

    private String search;
    private UUID statusId;
    private LeadStage stage;
    private LeadRating rating;
    private UUID ownerId;
    private UUID sourceId;
    private Integer scoreMin;
    private Integer scoreMax;
    private Boolean isConverted;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}

