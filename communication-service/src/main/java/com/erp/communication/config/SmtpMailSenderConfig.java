package com.erp.communication.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SmtpMailSenderConfig {

    private final SmtpProperties smtpProperties;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(smtpProperties.getHost());
        mailSender.setPort(smtpProperties.getPort());

        if (smtpProperties.getUsername() != null && !smtpProperties.getUsername().isBlank()) {
            mailSender.setUsername(smtpProperties.getUsername());
        }
        if (smtpProperties.getPassword() != null && !smtpProperties.getPassword().isBlank()) {
            mailSender.setPassword(smtpProperties.getPassword());
        }

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(smtpProperties.isAuth()));
        props.put("mail.smtp.starttls.enable", String.valueOf(smtpProperties.isStarttlsEnable()));
        props.put("mail.smtp.starttls.required", String.valueOf(smtpProperties.isStarttlsRequired()));
        props.put("mail.smtp.connectiontimeout", String.valueOf(smtpProperties.getConnectionTimeoutMs()));
        props.put("mail.smtp.timeout", String.valueOf(smtpProperties.getTimeoutMs()));
        props.put("mail.smtp.writetimeout", String.valueOf(smtpProperties.getWriteTimeoutMs()));

        log.info("Configured JavaMailSender with host: {}, port: {}, starttls: {}",
                smtpProperties.getHost(), smtpProperties.getPort(), smtpProperties.isStarttlsEnable());

        return mailSender;
    }
}
