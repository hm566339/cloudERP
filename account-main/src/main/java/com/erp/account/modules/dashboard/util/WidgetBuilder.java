package com.erp.account.modules.dashboard.util;

import com.erp.account.modules.dashboard.dto.response.DashboardWidget;

import java.util.UUID;

public class WidgetBuilder {

    public static DashboardWidget buildCard(String id, String title, String icon, Integer order, String permission, String module, Object data) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api("/api/v1/dashboard/metrics/" + id)
                .type("CARD")
                .data(data)
                .build();
    }

    public static DashboardWidget buildChart(String id, String title, String icon, Integer order, String permission, String module, Object data) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api("/api/v1/dashboard/charts/" + id)
                .type("CHART")
                .data(data)
                .build();
    }

    public static DashboardWidget buildNavigation(String id, String title, String icon, Integer order, String permission, String module, String path) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api(path)
                .type("NAVIGATION")
                .data(null)
                .build();
    }

    public static DashboardWidget buildAlert(String id, String title, String icon, Integer order, String permission, String module, Object data) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api("/api/v1/dashboard/alerts/" + id)
                .type("ALERT")
                .data(data)
                .build();
    }

    public static DashboardWidget buildActivity(String id, String title, String icon, Integer order, String permission, String module, Object data) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api("/api/v1/dashboard/activities/" + id)
                .type("ACTIVITY")
                .data(data)
                .build();
    }

    public static DashboardWidget buildApproval(String id, String title, String icon, Integer order, String permission, String module, Object data) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api("/api/v1/dashboard/approvals/" + id)
                .type("APPROVAL")
                .data(data)
                .build();
    }

    public static DashboardWidget buildQuickAction(String id, String title, String icon, Integer order, String permission, String module, String path) {
        return DashboardWidget.builder()
                .id(id)
                .title(title)
                .icon(icon)
                .order(order)
                .permission(permission)
                .module(module)
                .visible(true)
                .api(path)
                .type("QUICK_ACTION")
                .data(null)
                .build();
    }
}
