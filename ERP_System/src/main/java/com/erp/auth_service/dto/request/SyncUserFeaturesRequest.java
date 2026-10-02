package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncUserFeaturesRequest {

    @NotNull(message = "featureCodes list cannot be null")
    private List<String> featureCodes;
}
