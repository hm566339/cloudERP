package com.erp.account.integration.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkflowActionRequestDto {

    private UUID taskId;
    private String comments;
    private String reason;
    private UUID targetUserId;
    private Long version;
    private Map<String, Object> metadata;
}
