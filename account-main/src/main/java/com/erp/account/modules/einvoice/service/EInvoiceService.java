package com.erp.account.modules.einvoice.service;

import com.erp.account.modules.einvoice.dto.*;

import java.util.UUID;

public interface EInvoiceService {

    /**
     * Enqueues an asynchronous e-Invoice generation job via RabbitMQ.
     */
    EInvoiceJobResponseDto requestGeneration(UUID invoiceId, EInvoiceGenerateRequestDto request, UUID companyId);

    /**
     * Retrieves current e-Invoice status and IRN details for a sales invoice.
     */
    EInvoiceStatusResponseDto getInvoiceStatus(UUID invoiceId, UUID companyId);

    /**
     * Retrieves status of a specific background job.
     */
    EInvoiceJobResponseDto getJob(UUID jobId, UUID companyId);

    /**
     * Cancels an existing e-Invoice and IRN.
     */
    EInvoiceStatusResponseDto cancelEInvoice(UUID invoiceId, EInvoiceCancelRequestDto request, UUID companyId);

    /**
     * Queries provider and reconciles an uncertain/timeout e-Invoice status.
     */
    EInvoiceStatusResponseDto reconcileStatus(UUID invoiceId, UUID companyId);

    /**
     * Retrieves company/GSTIN provider configuration.
     */
    CompanyEInvoiceConfigDto getConfig(UUID companyId, UUID gstRegistrationId);

    /**
     * Saves company/GSTIN provider configuration.
     */
    CompanyEInvoiceConfigDto saveConfig(CompanyEInvoiceConfigDto dto, UUID companyId);
}
