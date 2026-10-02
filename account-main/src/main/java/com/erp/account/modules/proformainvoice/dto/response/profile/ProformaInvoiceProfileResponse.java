package com.erp.account.modules.proformainvoice.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.proformainvoice.dto.response.ProformaInvoiceItemResponse;
import lombok.*;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import com.erp.account.modules.quotation.dto.response.QuotationSummaryDTO;
import com.erp.account.modules.proformainvoice.dto.response.profile.PiPaymentSummaryDto;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProformaInvoiceProfileResponse extends BaseResponseDto  {
    private UUID id;
    private String piNumber;
    private LocalDate piDate;
    private LocalDate piValidTill;
    private String status;
    private String currency;
    private UUID sourceQuotationId;
    private String sourceQuotationNumber;
    private QuotationSummaryDTO quotation;
    
    private UUID customerId;
    private String customerName;
    private String customerCode;
    
    private Boolean advanceRequired;
    private java.math.BigDecimal advanceAmount;
    private String paymentCondition;
    
    // Just include raw snapshots or basic fields to save time in this implementation
    private String billingAddressSnapshot;
    private String deliveryAddressSnapshot;
    private String bankDetailsSnapshot;
    
    private java.math.BigDecimal subtotal;
    private java.math.BigDecimal discountAmount;
    private java.math.BigDecimal taxAmount;
    private java.math.BigDecimal freightCharges;
    private java.math.BigDecimal otherCharges;
    private java.math.BigDecimal roundOff;
    private java.math.BigDecimal totalAmount;
    
    private UUID paymentTermId;
    private String paymentTerms;
    private UUID termsConditionId;
    private String termsAndConditions;
    private String deliveryTerms;
    private String notes;
    
    private java.time.LocalDateTime createdAt;
    private UUID createdBy;
    private java.time.LocalDateTime updatedAt;
    private UUID updatedBy;
    private Boolean isDeleted;
    
    private PiPaymentSummaryDto paymentSummary;
    
    private List<ProformaInvoiceItemResponse> items;
}
