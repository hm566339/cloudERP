package com.erp.communication.template;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TemplateEngineServiceTest {

    private TemplateEngineService templateEngineService;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        templateEngineService = new TemplateEngineService(engine);
    }

    @Test
    @DisplayName("Should render EMPLOYEE_PROVISIONING template with valid data and HTML escaping")
    void testRenderEmployeeProvisioning() {
        Map<String, Object> data = new HashMap<>();
        data.put("fullName", "John <script>alert(1)</script> Doe");
        data.put("companyName", "Acme Corp & Co");
        data.put("username", "jdoe");
        data.put("email", "john.doe@example.com");
        data.put("setupUrl", "https://www.mark2.in/erp/set-password?token=secret123");
        data.put("companyLoginUrl", "https://www.mark2.in/erp/c/acme/login");
        data.put("validityHours", 24);

        RenderedEmail rendered = templateEngineService.render(TemplateCode.EMPLOYEE_PROVISIONING, null, data);

        assertNotNull(rendered);
        assertNotNull(rendered.getHtmlContent());
        assertTrue(rendered.getHtmlContent().contains("Acme Corp &amp; Co"));
        // Verify HTML escaping prevents script tag execution
        assertFalse(rendered.getHtmlContent().contains("<script>alert(1)</script>"));
        assertTrue(rendered.getHtmlContent().contains("John &lt;script&gt;alert(1)&lt;/script&gt; Doe"));
        assertTrue(rendered.getHtmlContent().contains("https://www.mark2.in/erp/set-password?token=secret123"));
        assertNotNull(rendered.getPlainTextContent());
    }

    @Test
    @DisplayName("Should render USER_VERIFICATION template")
    void testRenderUserVerification() {
        Map<String, Object> data = Map.of(
                "verificationUrl", "https://www.mark2.in/erp/verify?token=verify123"
        );

        RenderedEmail rendered = templateEngineService.render(TemplateCode.USER_VERIFICATION, null, data);

        assertNotNull(rendered);
        assertTrue(rendered.getHtmlContent().contains("Verify Email"));
        assertTrue(rendered.getHtmlContent().contains("https://www.mark2.in/erp/verify?token=verify123"));
    }

    @Test
    @DisplayName("Should render PASSWORD_RESET template")
    void testRenderPasswordReset() {
        Map<String, Object> data = Map.of(
                "fullName", "Alice Smith",
                "resetUrl", "https://www.mark2.in/erp/reset-password?token=reset123",
                "otpCode", "849201",
                "validityMinutes", 15
        );

        RenderedEmail rendered = templateEngineService.render(TemplateCode.PASSWORD_RESET, null, data);

        assertNotNull(rendered);
        assertTrue(rendered.getHtmlContent().contains("849201"));
        assertTrue(rendered.getHtmlContent().contains("Alice Smith"));
    }

    @Test
    @DisplayName("Should render RFQ and Quotation templates")
    void testRenderRfqAndQuotation() {
        Map<String, Object> rfqData = Map.of(
                "vendorName", "Steel Supplies Ltd",
                "rfqNumber", "RFQ-2026-0042",
                "companyName", "Mark2 Manufacturing",
                "quotationDeadline", "20-10-2026"
        );
        RenderedEmail rfq = templateEngineService.render(TemplateCode.RFQ_VENDOR_INVITATION, null, rfqData);
        assertNotNull(rfq);
        assertTrue(rfq.getHtmlContent().contains("RFQ-2026-0042"));
        assertTrue(rfq.getHtmlContent().contains("Steel Supplies Ltd"));

        Map<String, Object> quoteData = Map.of(
                "customerName", "Global Tech Inc",
                "quotationNumber", "QT-9901",
                "companyName", "Mark2 ERP",
                "totalAmount", "INR 1,45,000"
        );
        RenderedEmail quote = templateEngineService.render(TemplateCode.QUOTATION_EMAIL, null, quoteData);
        assertNotNull(quote);
        assertTrue(quote.getHtmlContent().contains("QT-9901"));
        assertTrue(quote.getHtmlContent().contains("INR 1,45,000"));
    }

    @Test
    @DisplayName("Should render USER_INVITATION template with organization, name, activation link, and HTML escaping")
    void testRenderUserInvitation() {
        Map<String, Object> data = new HashMap<>();
        data.put("fullName", "Jane <script>alert('xss')</script> Smith");
        data.put("organizationName", "Apex Global Enterprise & Co");
        data.put("username", "jsmith");
        data.put("email", "jane.smith@example.com");
        data.put("activationLink", "https://mark2.in/set-password?token=invitation_tok_abc123");
        data.put("validityHours", 24);

        RenderedEmail rendered = templateEngineService.render(TemplateCode.USER_INVITATION, null, data);

        assertNotNull(rendered);
        assertNotNull(rendered.getHtmlContent());
        assertTrue(rendered.getHtmlContent().contains("Apex Global Enterprise &amp; Co"));
        // Check XSS escaping
        assertFalse(rendered.getHtmlContent().contains("<script>alert('xss')</script>"));
        assertTrue(rendered.getHtmlContent().contains("&lt;script&gt;alert"));
        assertTrue(rendered.getHtmlContent().contains("https://mark2.in/set-password?token=invitation_tok_abc123"));
        assertTrue(rendered.getHtmlContent().contains("Activate Account &amp; Set Password"));
        assertNotNull(rendered.getPlainTextContent());
    }
}
