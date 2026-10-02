package com.erp.account.modules.quotation.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationProfileResponse extends BaseResponseDto  {
    private UUID id;
    private String quotationNumber;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private String status;
    private String currency;
    private BigDecimal exchangeRate;
    
    private String referenceNumber;
    
    private UUID placeOfSupplyStateId;
    private String placeOfSupplyStateCode;
    private String placeOfSupply;
    
    private QtCompanyInfoDto companyInformation;
    private QtCustomerInfoDto customerInformation;
    private List<QtLineItemDto> lineItems;
    private QtTaxSummaryDto taxSummary;
    private QtAmountSummaryDto amountSummary;
    private QtTermsAndConditionsDto termsAndConditions;
    private QtBillingInfoDto billingInformation;
    private QtDeliveryInfoDto deliveryInformation;
    private QtApprovalWorkflowDto approvalWorkflow;
    private QtAuditInfoDto auditInformation;
    private QtStatisticsDto statistics;
}
