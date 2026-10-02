package com.erp.account.modules.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardWidget implements Serializable {
    private String id;
    private String title;
    private String icon;
    private Integer order;
    private String permission;
    private String module;
    private Boolean visible;
    private String api;
    private String type; // e.g., CARD, CHART, ALERT, ACTIVITY, APPROVAL, NAVIGATION, QUICK_ACTION
    private Object data;
}
