package com.erp.communication.channel;

import com.erp.communication.channel.email.EmailMessage;
import com.erp.communication.channel.email.SmtpEmailProvider;
import com.erp.communication.config.SmtpProperties;
import com.erp.communication.model.Attachment;
import com.erp.communication.model.CommunicationResult;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SmtpEmailProviderTest {

    private JavaMailSender mailSender;
    private SmtpProperties properties;
    private SmtpEmailProvider smtpProvider;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        properties = new SmtpProperties();
        properties.setFromAddress("custom-sender@mark2.in");
        properties.setFromName("Mark2 Verification");
        properties.setHost("smtp.example.com");
        properties.setPort(587);

        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        smtpProvider = new SmtpEmailProvider(mailSender, properties);
    }

    @Test
    @DisplayName("Should send email successfully and set explicit From address")
    void testSendEmailSuccess() throws Exception {
        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("employee@example.com")
                .subject("Welcome to Mark2 ERP")
                .htmlBody("<p>Hello</p>")
                .textBody("Hello")
                .attachments(List.of(
                        Attachment.builder()
                                .filename("invoice.pdf")
                                .contentType("application/pdf")
                                .data("sample-pdf-bytes".getBytes(StandardCharsets.UTF_8))
                                .build()
                ))
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertTrue(result.isSuccess());
        assertEquals("SMTP", result.getProviderName());
        assertNotNull(result.getProviderMessageId());

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertNotNull(sentMessage.getFrom());
        assertEquals("custom-sender@mark2.in", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getAddress());
        assertEquals("Mark2 Verification", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getPersonal());
    }

    @Test
    @DisplayName("Should reject blank or invalid recipient email")
    void testInvalidRecipient() {
        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("not-an-email")
                .subject("Test")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("Invalid recipient email"));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should catch SMTP socket exception without printing secrets")
    void testSmtpExceptionHandling() {
        doThrow(new MailSendException("SMTP server connection timeout: auth password=secret_pw"))
                .when(mailSender).send(any(MimeMessage.class));

        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("user@example.com")
                .subject("Test")
                .htmlBody("<p>Test</p>")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
        // Verify password is sanitized
        assertFalse(result.getErrorMessage().contains("secret_pw"));
    }
}
