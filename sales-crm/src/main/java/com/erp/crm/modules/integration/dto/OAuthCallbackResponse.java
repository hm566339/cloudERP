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
    private String facebookUserId;
    private String facebookUserName;
    private java.util.UUID integrationId;
    private List<FacebookPageDto> pages;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacebookPageDto {
        private String pageId;
        private String pageName;
        private String category;
        private String pageAccessToken;
        private Boolean isSyncEnabled;
        private String leadPoolId;
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
        private String leadPoolId;
        private Boolean autoQualify;
    }
}
