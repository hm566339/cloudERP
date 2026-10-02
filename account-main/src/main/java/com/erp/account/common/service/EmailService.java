package com.erp.account.common.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Sends an email with a PDF attachment.
     *
     * @param to            Recipient email address
     * @param subject       Email subject
     * @param body          Email body content (HTML or plain text)
     * @param pdfAttachment The PDF content as a byte array
     * @param filename      The name of the attached file (e.g., "invoice.pdf")
     */
    public void sendEmailWithPdfAttachment(String to, String subject, String body, byte[] pdfAttachment, String filename) {
        sendEmailWithPdfAttachmentAndType(to, subject, body, pdfAttachment, filename, false);
    }

    /**
     * Sends an HTML email with a PDF attachment.
     */
    public void sendHtmlEmailWithPdfAttachment(String to, String subject, String body, byte[] pdfAttachment, String filename) {
        sendEmailWithPdfAttachmentAndType(to, subject, body, pdfAttachment, filename, true);
    }

    private void sendEmailWithPdfAttachmentAndType(String to, String subject, String body, byte[] pdfAttachment, String filename, boolean isHtml) {
        log.info("Sending email with PDF attachment to {}", to);
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, isHtml); // Use the isHtml flag

            // Add the PDF attachment
            helper.addAttachment(filename, new ByteArrayResource(pdfAttachment));

            javaMailSender.send(message);
            log.info("Email sent successfully to {}", to);

        } catch (MessagingException | MailException e) {
            log.error("Failed to send email to {}", to, e);
            throw new RuntimeException("Failed to send email. Please check SMTP configuration.", e);
        }
    }
}
