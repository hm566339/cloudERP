package com.erp.crm.modules.integration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthCallbackResponse {

    private boolean success;
    private String userAccessToken;
    private List<FacebookPageDto> pages;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacebookPageDto {
        private String pageId;
        private String pageName;
        private String pageAccessToken;
        private List<FacebookFormDto> forms;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacebookFormDto {
        private String formId;
        private String formName;
        private String status;
    }
}
