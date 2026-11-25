package com.erp.communication.security.sso;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenVerifyResponse {
    private boolean valid;
    private UserResponse user;
    private List<Map<String, Object>> features;
    private List<Map<String, Object>> permissions;
}
