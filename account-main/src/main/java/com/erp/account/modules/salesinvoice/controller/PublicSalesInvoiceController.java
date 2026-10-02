package com.erp.account.modules.salesinvoice.controller;

import com.erp.account.modules.salesinvoice.service.SalesInvoicePdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account/public/sales/invoices")
@Tag(name = "Public Sales Invoices", description = "Public endpoints for Sales Invoices (No Authentication Required)")
public class PublicSalesInvoiceController {

    private final SalesInvoicePdfService salesInvoicePdfService;

    @GetMapping(path = "/{invoiceId}/pdf")
    @Operation(summary = "Download invoice PDF public link", description = "Generates and downloads the tax invoice PDF without requiring authentication.")
    public void downloadPublicInvoicePdf(
            @PathVariable UUID invoiceId,
            HttpServletResponse response) throws java.io.IOException {
        log.info("Public API: Downloading invoice PDF for: {}", invoiceId);

        try {
            // Passing null for companyId will use TenantUtils fallback
            // But since this is a public API, TenantUtils will not have a current user.
            // We need a specific method in SalesInvoicePdfService to bypass the company
            // check for public links.
            // Wait, let's just pass null. The implementation of generateSalesInvoicePdf
            // has:
            // if (!TenantUtils.isSystemAdmin()) {
            // UUID resolvedCompanyId = companyId != null ? companyId :
            // TenantUtils.getCurrentCompanyId();
            // if (resolvedCompanyId == null ||
            // !invoice.getCompanyId().equals(resolvedCompanyId)) throw ...
            // }
            // Wait! If we pass null, TenantUtils.getCurrentCompanyId() will return null, so
            // resolvedCompanyId is null, and it will THROW an error!
            // I need to create a dedicated method for public PDF generation in
            // SalesInvoicePdfService that bypasses security, OR I pass the invoice's own
            // company ID to bypass the check.

            // Let's pass a dummy company ID? No, generateSalesInvoicePdf does:
            // if (resolvedCompanyId == null ||
            // !invoice.getCompanyId().equals(resolvedCompanyId)) throw
            // So if we don't know the company ID, we can't bypass it unless we change the
            // service.

            // Wait, I can't pass the invoice's companyId because I don't have the invoice
            // here.
            // Let's add a public method to the service. For now, I'll write the controller,
            // but I must update the service!

            byte[] pdfBytes = salesInvoicePdfService.generatePublicSalesInvoicePdf(invoiceId);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"invoice-" + invoiceId + ".pdf\"");
            response.getOutputStream().write(pdfBytes);
            response.getOutputStream().flush();
        } catch (Exception ex) {
            log.error("Error generating public PDF: {}", ex.getMessage());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            int status = HttpStatus.INTERNAL_SERVER_ERROR.value();
            String message = "An unexpected error occurred";
            String errorType = ex.getClass().getSimpleName();

            if (ex instanceof com.erp.account.common.exception.ResourceNotFoundException
                    || errorType.endsWith("NotFoundException")) {
                status = HttpStatus.NOT_FOUND.value();
                message = ex.getMessage();
            } else if (ex instanceof com.erp.account.common.exception.BaseApplicationException) {
                status = HttpStatus.BAD_REQUEST.value();
                message = ex.getMessage();
            }
            response.setStatus(status);

            String json = String.format(
                    "{\"success\":false,\"message\":\"%s\",\"status\":%d,\"data\":{\"error\":\"%s\"}}",
                    message != null ? message.replace("\"", "\\\"") : "", status, errorType);
            response.getWriter().write(json);
            response.getWriter().flush();
        }
    }
}
