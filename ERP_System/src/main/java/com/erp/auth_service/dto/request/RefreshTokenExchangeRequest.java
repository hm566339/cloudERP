package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class RefreshTokenExchangeRequest {

    @JsonProperty("refresh_token")
    @JsonAlias("refreshToken")
    private String refreshToken;

    @JsonProperty("client_id")
    @JsonAlias("clientId")
    private UUID clientId;

    @JsonProperty("client_secret")
    @JsonAlias("clientSecret")
    private String clientSecret;
}