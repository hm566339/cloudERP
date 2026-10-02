package com.erp.account.modules.auth.dto.ssoresponse;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogoutResponse extends BaseResponseDto  {

    private boolean success;
    private String message;
}
