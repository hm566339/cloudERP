package com.erp.communication.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.smtp")
@Getter
@Setter
public class SmtpProperties {

    private String host = "smtp.gmail.com";
    private int port = 587;
    private String username = "";
    private String password = "";
    private boolean auth = true;
    private boolean starttlsEnable = true;
    private boolean starttlsRequired = true;
    private String fromAddress = "noreply@mark2.in";
    private String fromName = "Mark2 ERP";
    private String replyTo = "";
    private int connectionTimeoutMs = 10000;
    private int timeoutMs = 10000;
    private int writeTimeoutMs = 10000;

    @Override
    public String toString() {
        // Redact password strictly in logs and toString
        return "SmtpProperties(host=" + host + ", port=" + port +
                ", username=" + (username != null && !username.isBlank() ? "***@" + host : "[empty]") +
                ", auth=" + auth + ", starttls=" + starttlsEnable +
                ", fromAddress=" + fromAddress + ", fromName=" + fromName + ")";
    }
}
