package com.erp.crm.modules.auth.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefreshToken {

    private String refreshToken;

    private String clientId;

}
