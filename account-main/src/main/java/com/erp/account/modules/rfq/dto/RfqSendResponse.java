package com.erp.account.modules.rfq.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * Response DTO for the POST /api/account/rfqs/{id}/send endpoint.
 *
 * <p>Distinguishes between two independent outcomes:
 * <ol>
 *   <li>RFQ status transition (always succeeds when the business rules are met)</li>
 *   <li>Email dispatch to vendors (best-effort; missing/invalid emails or SMTP failures
 *       do NOT roll back the status change)</li>
 * </ol>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RfqSendResponse {

    /** Full RFQ payload after the status transition. */
    private RfqResponse rfq;

    /**
     * {@code true} when at least one vendor email was dispatched successfully.
     * {@code false} when no emails were sent (no valid addresses, or all failed).
     */
    private boolean emailSent;

    /** Number of vendor emails successfully dispatched. */
    private int emailsSentCount;

    /** Number of vendor emails that failed during SMTP dispatch. */
    private int emailsFailedCount;

    /** Number of vendors skipped because their email was absent or invalid. */
    private int vendorsWithoutEmail;

    /** Contextual message describing the outcome of the send operation. */
    private String message;
}
