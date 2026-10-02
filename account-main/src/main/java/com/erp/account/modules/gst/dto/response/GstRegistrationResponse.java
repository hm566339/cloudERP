package com.erp.account.modules.gst.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.modules.gst.enums.GstRegistrationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstRegistrationResponse extends BaseResponseDto  {
    private UUID id;
    private EntityReference company;
    private EntityReference branch;
    private String gstin;
    private String pan;
    private GstRegistrationType registrationType;
    private LocalDate registeredDate;
    private String legalName;
    private String tradeName;
    private GstStateCodeResponse stateCode;
    private boolean isDefault;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EntityReference {
        private UUID id;
        private String name;
    }
}
