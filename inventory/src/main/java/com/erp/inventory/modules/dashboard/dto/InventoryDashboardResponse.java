package com.erp.inventory.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDashboardResponse {
    private String role;
    private Map<String, Object> summary;
    private List<MetricDto> metrics;
    private List<MetricDto> alerts;
}
