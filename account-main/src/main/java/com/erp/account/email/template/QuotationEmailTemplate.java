package com.erp.account.email.template;

import com.erp.account.email.dto.QuotationEmailData;
import org.springframework.web.util.HtmlUtils;
import java.time.format.DateTimeFormatter;

public class QuotationEmailTemplate {

    public static String buildHtml(QuotationEmailData data) {
        StringBuilder sb = new StringBuilder();
        
        String safeCustomerName = escape(data.getCustomerName());
        String safeCompanyName = escape(data.getCompanyName());
        String safeQuotationNumber = escape(data.getQuotationNumber());
        String safeCompanyEmail = escape(data.getCompanyEmail());
        String safeCompanyPhone = escape(data.getCompanyPhone());
        String safeCompanyAddress = escape(data.getCompanyAddress());
        String currency = escape(data.getCurrency() != null ? data.getCurrency() : "INR");
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        String qDate = data.getQuotationDate() != null ? data.getQuotationDate().format(formatter) : "";
        String vDate = data.getValidUntil() != null ? data.getValidUntil().format(formatter) : "";
        String amount = data.getTotalAmount() != null ? String.format("%,.2f", data.getTotalAmount()) : "0.00";

        sb.append("<!DOCTYPE html>");
        sb.append("<html><head><meta charset=\"UTF-8\">");
        sb.append("<style>");
        sb.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; background-color: #f9f9f9; }");
        sb.append(".container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }");
        sb.append(".header { text-align: center; border-bottom: 2px solid #eeeeee; padding-bottom: 20px; margin-bottom: 20px; }");
        sb.append(".logo { max-height: 80px; margin-bottom: 10px; }");
        sb.append(".company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin: 0; }");
        sb.append(".doc-title { font-size: 20px; color: #7f8c8d; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px; }");
        sb.append(".content { margin-bottom: 30px; }");
        sb.append(".details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }");
        sb.append(".details-table th { text-align: left; padding: 12px; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; color: #495057; font-weight: 600; width: 40%; }");
        sb.append(".details-table td { padding: 12px; border-bottom: 1px solid #dee2e6; color: #212529; font-weight: bold; }");
        sb.append(".footer { font-size: 13px; color: #777777; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 20px; line-height: 1.5; }");
        sb.append("</style>");
        sb.append("</head><body>");
        
        sb.append("<div class=\"container\">");
        
        // Header
        sb.append("<div class=\"header\">");
        if (data.getCompanyLogo() != null && !data.getCompanyLogo().trim().isEmpty()) {
            sb.append("<img src=\"").append(escape(data.getCompanyLogo())).append("\" class=\"logo\" alt=\"Company Logo\"/>");
        }
        sb.append("<h1 class=\"company-name\">").append(safeCompanyName).append("</h1>");
        sb.append("<div class=\"doc-title\">Quotation</div>");
        sb.append("</div>");
        
        // Content
        sb.append("<div class=\"content\">");
        sb.append("<p>Dear <strong>").append(safeCustomerName).append("</strong>,</p>");
        sb.append("<p>Please find attached our quotation.</p>");
        
        sb.append("<table class=\"details-table\">");
        sb.append("<tr><th>Quotation Number</th><td>").append(safeQuotationNumber).append("</td></tr>");
        if (data.getReferenceNumber() != null && !data.getReferenceNumber().isEmpty()) {
            sb.append("<tr><th>Reference Number</th><td>").append(escape(data.getReferenceNumber())).append("</td></tr>");
        }
        sb.append("<tr><th>Quotation Date</th><td>").append(qDate).append("</td></tr>");
        sb.append("<tr><th>Valid Until</th><td>").append(vDate).append("</td></tr>");
        sb.append("<tr><th>Total Amount</th><td style=\"color: #27ae60;\">").append(currency).append(" ").append(amount).append("</td></tr>");
        sb.append("</table>");
        
        if (data.getAcceptUrl() != null && !data.getAcceptUrl().isEmpty()) {
            sb.append("<div style=\"text-align: center; margin: 30px 0;\">");
            sb.append("<a href=\"").append(escape(data.getAcceptUrl())).append("\" style=\"background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;\">Accept Quotation</a>");
            sb.append("</div>");
        }
        
        sb.append("<p>Please review the attached quotation PDF.</p>");
        sb.append("<p>If you have any questions, please contact us.</p>");
        sb.append("<p>Regards,</p>");
        sb.append("</div>");
        
        // Footer
        sb.append("<div class=\"footer\">");
        sb.append("<strong>").append(safeCompanyName).append("</strong><br/>");
        if (safeCompanyEmail != null && !safeCompanyEmail.isEmpty()) {
            sb.append("Email: ").append(safeCompanyEmail).append("<br/>");
        }
        if (safeCompanyPhone != null && !safeCompanyPhone.isEmpty()) {
            sb.append("Phone: ").append(safeCompanyPhone).append("<br/>");
        }
        if (data.getGstin() != null && !data.getGstin().isEmpty()) {
            sb.append("GSTIN: ").append(escape(data.getGstin())).append("<br/>");
        }
        if (safeCompanyAddress != null && !safeCompanyAddress.isEmpty()) {
            sb.append(safeCompanyAddress);
        }
        sb.append("</div>");
        
        sb.append("</div>");
        sb.append("</body></html>");
        
        return sb.toString();
    }
    
    private static String escape(String value) {
        if (value == null) return "";
        return HtmlUtils.htmlEscape(value);
    }
}
