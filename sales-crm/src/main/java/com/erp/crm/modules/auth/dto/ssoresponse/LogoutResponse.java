package com.erp.crm.modules.auth.dto.ssoresponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogoutResponse {

    private boolean success;
    private String message;
}
