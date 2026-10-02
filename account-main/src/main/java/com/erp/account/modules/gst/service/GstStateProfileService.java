package com.erp.account.modules.gst.service;

import com.erp.account.modules.gst.dto.profile.*;
import java.util.UUID;

public interface GstStateProfileService {
    GstStateProfileDto getGstStateProfile(UUID id);
    GstStateStatisticsDto getGstStateStatistics(UUID id);
    GstStateOverviewDto getGstStateOverview(UUID id);
    GstStateRelationsDto getGstStateRelations(UUID id);
}
