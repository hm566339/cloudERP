package com.erp.communication.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.service-auth")
@Getter
@Setter
public class ServiceAuthProperties {

    private String internalToken = "mark2-internal-comm-secret-token";
    private String headerName = "X-Service-Token";
}
