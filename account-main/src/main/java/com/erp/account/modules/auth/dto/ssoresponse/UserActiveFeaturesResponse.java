package com.erp.account.modules.auth.dto.ssoresponse;

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
public class UserActiveFeaturesResponse {

    private UUID userId;
    private String username;
    private List<String> activeFeatures;
}
