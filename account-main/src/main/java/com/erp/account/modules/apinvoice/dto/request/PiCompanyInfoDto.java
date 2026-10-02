package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiCompanyInfoDto {
    private UUID companyId;
    private String companyName;
    private String gstin;
    private String pan;
    private String address;
    private String baseCurrency;
}
