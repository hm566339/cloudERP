package com.erp.account.modules.paymentvoucher.dto.response.profile;

import com.erp.account.enums.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInstrumentDto {
    private PaymentMode paymentMode;
    private String chequeNumber;
    private LocalDate chequeDate;
    private String upiReferenceNumber;
    private String transactionReference;
    private String utrNumber;
    private String gatewayReference;
    private String paymentGateway;
}
