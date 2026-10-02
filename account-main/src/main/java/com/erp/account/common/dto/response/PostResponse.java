package com.erp.account.common.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PostResponse extends BaseResponseDto  {

    private String message;
    private UUID id;
    private String code;

}

