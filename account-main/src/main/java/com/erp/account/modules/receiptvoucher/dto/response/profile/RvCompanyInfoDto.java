package com.erp.account.modules.receiptvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RvCompanyInfoDto {
    private UUID companyId;
    private String companyName;
    private String gstin;
    private String pan;
    private String baseCurrency;
}
