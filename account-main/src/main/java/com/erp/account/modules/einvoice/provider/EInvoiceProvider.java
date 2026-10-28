package com.erp.account.modules.einvoice.provider;

import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCancelResult;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCanonicalPayload;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceProviderResult;

/**
 * Provider-agnostic interface for GST e-Invoice operations.
 * Concrete implementations adapt either official NIC IRP endpoints or GSP APIs.
 */
public interface EInvoiceProvider {

    EInvoiceProviderType getProviderType();

    /**
     * Submits canonical invoice to IRP/GSP to generate IRN, Ack details, and signed QR code.
     */
    EInvoiceProviderResult generateIrn(CompanyEInvoiceConfig config, EInvoiceCanonicalPayload payload);

    /**
     * Cancels an existing IRN within the 24-hour statutory window.
     */
    EInvoiceCancelResult cancelIrn(CompanyEInvoiceConfig config, String irn, String cancelReason, String remarks);

    /**
     * Queries existing IRN details for reconciliation and status synchronization.
     */
    EInvoiceProviderResult getIrnDetails(CompanyEInvoiceConfig config, String irn);
}
