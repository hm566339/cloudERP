package com.erp.account.modules.dashboard.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse extends BaseResponseDto  implements Serializable {
    private List<DashboardWidget> cards;
    private List<DashboardWidget> charts;
    private List<DashboardWidget> alerts;
    private List<DashboardWidget> activities;
    private List<DashboardWidget> quickActions;
    private List<DashboardWidget> approvals;
    private List<DashboardWidget> navigation;
}
