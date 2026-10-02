package com.erp.auth_service.dto.response;

import org.springframework.data.convert.ReadingConverter;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@ReadingConverter
public class ComapanyOpenResponse {
    private String companyCode;
    private String companyName;
}
