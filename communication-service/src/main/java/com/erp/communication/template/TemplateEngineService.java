package com.erp.communication.template;

import com.erp.communication.exception.TemplateRenderingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateEngineService {

    private final TemplateEngine templateEngine;

    public RenderedEmail render(TemplateCode templateCode, String customSubject, Map<String, Object> templateData) {
        if (templateCode == null) {
            throw new TemplateRenderingException("TemplateCode cannot be null");
        }

        String templateName = templateCode.getTemplateName();
        String subject = (customSubject != null && !customSubject.isBlank())
                ? customSubject.trim()
                : templateCode.getDefaultSubject();

        try {
            Context context = new Context(Locale.ENGLISH);
            if (templateData != null) {
                templateData.forEach(context::setVariable);
            }

            String htmlBody = templateEngine.process(templateName, context);
            String plainText = htmlToPlainText(htmlBody);

            return RenderedEmail.builder()
                    .subject(subject)
                    .htmlContent(htmlBody)
                    .plainTextContent(plainText)
                    .build();

        } catch (Exception ex) {
            log.error("Failed to render template [{}] with error: {}", templateName, ex.getMessage());
            throw new TemplateRenderingException("Failed to render email template [" + templateName + "]: " + ex.getMessage(), ex);
        }
    }

    private String htmlToPlainText(String html) {
        if (html == null) return "";
        return html
                .replaceAll("(?is)<style.*?>.*?</style>", "")
                .replaceAll("(?is)<script.*?>.*?</script>", "")
                .replaceAll("<br\\s*/?>", "\n")
                .replaceAll("</p>", "\n\n")
                .replaceAll("</div>", "\n")
                .replaceAll("</tr>", "\n")
                .replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }
}
