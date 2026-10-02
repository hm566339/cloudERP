package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.dto.*;
import java.util.List;

public interface GstReportService {
    GstSummaryDto getGstSummary(GstReportFilterDto filter);
    List<Gstr1Dto> getGstr1(GstReportFilterDto filter);
    Gstr3bDto getGstr3b(GstReportFilterDto filter);
    HsnSummaryResponse getHsnSummary(GstReportRequest request);
    ItcReportDto getItcReport(GstReportRequest request);
}
