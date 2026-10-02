package com.erp.account.modules.quotation.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.quotation.entity.QuotationStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    
    private CompanyResponse company;
    private CustomerResponse customer;
    
    private String quotationNumber;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private String referenceNumber;
    
    private String quotationCurrency;
    private BigDecimal exchangeRate;
    
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal freightCharges;
    private BigDecimal otherCharges;
    private BigDecimal totalBeforeRoundOff;
    private BigDecimal taxAmount;
    private BigDecimal roundOff;
    private BigDecimal totalAmount;
    
    private UUID placeOfSupplyStateId;
    private String placeOfSupplyStateCode;
    
    private UUID deliveryAddressId;
    private String deliveryAddressLine1;
    private String deliveryAddressLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPostalCode;
    private String deliveryCountry;
    
    private UUID billingAddressId;
    private String billingAddressLine1;
    private String billingAddressLine2;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;
    private String billingStateCode;
    
    private UUID paymentTermId;
    private String paymentTerms;
    private UUID deliveryTermId;
    private String deliveryTerms;
    private UUID warrantyTermId;
    private String warrantyTerms;
    private UUID termsConditionId;
    private String termsAndConditions;
    private String notes;
    
    private UUID salesManagerId;
    
    private QuotationStatus status;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    
    private List<QuotationItemResponse> items;
    
    private UUID createdBy;
    private LocalDateTime createdAt;
    private UUID updatedBy;
    private LocalDateTime updatedAt;
}
