package com.erp.workflow.dto.flow;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFlowDataDto {
    @Builder.Default
    private List<DocumentFlowNodeDto> nodes = new ArrayList<>();

    @Builder.Default
    private List<DocumentFlowTransitionDto> transitions = new ArrayList<>();
}
