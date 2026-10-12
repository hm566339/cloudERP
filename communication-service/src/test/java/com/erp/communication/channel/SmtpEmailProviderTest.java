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

    @Test
    @DisplayName("Should compose and send HTML-only email without multipart errors")
    void testHtmlOnlyEmailComposition() throws Exception {
        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("test@example.com")
                .subject("HTML Only Notification")
                .htmlBody("<div style='color:blue'><h1>Welcome</h1><p>Test HTML body</p></div>")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertTrue(result.isSuccess());
        assertEquals("SMTP", result.getProviderName());

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertEquals("test@example.com", ((jakarta.mail.internet.InternetAddress) sentMessage.getAllRecipients()[0]).getAddress());
        assertEquals("HTML Only Notification", sentMessage.getSubject());
        assertNotNull(sentMessage.getContentType());
    }

    @Test
    @DisplayName("Should compose plain-text and HTML alternative content without attachments (prevents 'Not in multipart mode' error)")
    void testPlainTextAndHtmlAlternativeContentWithoutAttachments() throws Exception {
        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("employee@example.com")
                .subject("Alternative Text and HTML Test")
                .textBody("Hello Employee, Welcome to Mark2 ERP! Please visit https://www.mark2.in/erp to login.")
                .htmlBody("<p>Hello Employee,</p><p>Welcome to <strong>Mark2 ERP</strong>!</p><p><a href='https://www.mark2.in/erp'>Login</a></p>")
                // No attachments
                .attachments(null)
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        // Must succeed without throwing IllegalStateException: "Not in multipart mode"
        assertTrue(result.isSuccess(), "Email with alternative plain text and HTML should succeed in multipart mode");
        assertEquals("SMTP", result.getProviderName());

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertNotNull(sentMessage.getContent());
        assertTrue(sentMessage.getContentType().toLowerCase().contains("multipart"),
                "Message Content-Type must be multipart to support alternative text/html parts");
    }

    @Test
    @DisplayName("Should compose employee provisioning email correctly with branding, recipient, and setup link")
    void testEmployeeProvisioningEmailComposition() throws Exception {
        String setupUrl = "https://www.mark2.in/erp/set-password?token=mock_setup_token_xyz987";
        String loginUrl = "https://www.mark2.in/erp/c/acme-corp/login";

        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("newhire@acme.com")
                .subject("Your Mark2 ERP Account Is Ready — Set Your Password")
                .textBody("Hello New Hire,\n\nYour account has been provisioned in Acme Corp.\nUsername: newhire\nSet Password: " + setupUrl + "\nLogin: " + loginUrl)
                .htmlBody("<div style='font-family:sans-serif;'><h1>Welcome to Acme Corp</h1><p>Username: <strong>newhire</strong></p><a href='" + setupUrl + "'>Set Your Password</a></div>")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertTrue(result.isSuccess());
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertEquals("newhire@acme.com", ((jakarta.mail.internet.InternetAddress) sentMessage.getAllRecipients()[0]).getAddress());
        assertEquals("Your Mark2 ERP Account Is Ready — Set Your Password", sentMessage.getSubject());
        assertEquals("custom-sender@mark2.in", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getAddress());
        assertEquals("Mark2 Verification", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getPersonal());
    }

    @Test
    @DisplayName("Should classify composition and invalid recipient errors as permanent (non-retryable)")
    void testCompositionErrorHandlingAndSanitization() {
        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("invalid-format-without-at")
                .subject("Test")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertFalse(result.isSuccess());
        assertFalse(result.isRetryable(), "Invalid recipient address must be classified as permanent failure");
        assertTrue(result.getErrorMessage().contains("Invalid recipient email address format"));
    }

    @Test
    @DisplayName("Should align From address to authenticated username and route original sender to Reply-To when using Gmail SMTP")
    void testGmailSenderMismatchAlignmentAndReplyTo() throws Exception {
        properties.setHost("smtp.gmail.com");
        properties.setUsername("authenticated-account@gmail.com");
        properties.setFromAddress("different-sender@gmail.com");
        properties.setFromName("Mark2 Alerts");
        properties.setReplyTo(null);

        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("client@example.com")
                .subject("Status Update")
                .textBody("System notification")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertTrue(result.isSuccess());
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        // From address must be aligned to the authenticated account to prevent Google silent drop
        assertEquals("authenticated-account@gmail.com", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getAddress());
        assertEquals("Mark2 Alerts", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getPersonal());

        // Reply-To must be automatically set to the configured different-sender@gmail.com
        assertNotNull(sentMessage.getReplyTo());
        assertEquals("different-sender@gmail.com", ((jakarta.mail.internet.InternetAddress) sentMessage.getReplyTo()[0]).getAddress());
    }

    @Test
    @DisplayName("Should preserve existing Reply-To if explicitly configured even when Gmail sender is aligned")
    void testGmailSenderMismatchWithExplicitReplyTo() throws Exception {
        properties.setHost("smtp.gmail.com");
        properties.setUsername("authenticated-account@gmail.com");
        properties.setFromAddress("unaligned@gmail.com");
        properties.setReplyTo("explicit-support@mark2.in");

        EmailMessage message = EmailMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("client@example.com")
                .subject("Explicit Reply-To Test")
                .textBody("Hello")
                .build();

        CommunicationResult result = smtpProvider.sendEmail(message);

        assertTrue(result.isSuccess());
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertEquals("authenticated-account@gmail.com", ((jakarta.mail.internet.InternetAddress) sentMessage.getFrom()[0]).getAddress());
        assertEquals("explicit-support@mark2.in", ((jakarta.mail.internet.InternetAddress) sentMessage.getReplyTo()[0]).getAddress());
    }
}
