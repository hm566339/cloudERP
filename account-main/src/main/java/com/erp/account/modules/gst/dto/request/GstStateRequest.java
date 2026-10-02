package com.erp.account.modules.gst.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstStateRequest {

    @NotBlank(message = "State Code is required")
    @Size(min = 2, max = 2, message = "State code must be exactly 2 characters")
    private String stateCode;

    @NotBlank(message = "State Name is required")
    @Size(max = 100, message = "State name cannot exceed 100 characters")
    private String stateName;

    @JsonProperty("unionTerritory")
    private boolean isUnionTerritory;
}
