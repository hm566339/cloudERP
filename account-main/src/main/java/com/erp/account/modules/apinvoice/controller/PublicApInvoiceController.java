package com.erp.account.modules.apinvoice.controller;

import com.erp.account.modules.apinvoice.service.ApInvoicePdfService;
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
@RequestMapping("/api/account/public/ap/invoices")
@Tag(name = "Public AP Invoices", description = "Public endpoints for AP Invoices (No Authentication Required)")
public class PublicApInvoiceController {

    private final ApInvoicePdfService apInvoicePdfService;

    @GetMapping(path = "/{invoiceId}/pdf")
    @Operation(summary = "Download AP invoice PDF public link", description = "Generates and downloads the purchase invoice PDF without requiring authentication.")
    public void downloadPublicInvoicePdf(
            @PathVariable UUID invoiceId,
            HttpServletResponse response) throws java.io.IOException {
        log.info("Public API: Downloading purchase invoice PDF for: {}", invoiceId);

        try {
            byte[] pdfBytes = apInvoicePdfService.generatePublicApInvoicePdf(invoiceId);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"purchase-invoice-" + invoiceId + ".pdf\"");
            response.getOutputStream().write(pdfBytes);
            response.getOutputStream().flush();
        } catch (Exception ex) {
            log.error("Error generating public AP PDF: {}", ex.getMessage());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            int status = HttpStatus.INTERNAL_SERVER_ERROR.value();
            String message = "An unexpected error occurred";
            String errorType = ex.getClass().getSimpleName();

            if (ex instanceof com.erp.account.common.exception.ResourceNotFoundException
                    || errorType.endsWith("NotFoundException")) {
                status = HttpStatus.NOT_FOUND.value();
                message = ex.getMessage();
            } else if (ex.getClass().getName().contains("BaseApplicationException")) {
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
