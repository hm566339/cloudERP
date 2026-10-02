package com.erp.account.modules.report.gst.facade;

import com.erp.account.modules.report.gst.dto.*;
import com.erp.account.modules.report.gst.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GstReportFacade {

    private final GstSummaryService gstSummaryService;
    private final Gstr1Service gstr1Service;
    private final GstReportService gstReportService;

    public GstSummaryDto getGstSummary(GstReportFilterDto filter) {
        return gstSummaryService.getSummary(filter);
    }

    public Page<Gstr1Dto> getGstr1(GstReportRequest request) {
        return gstr1Service.getGstr1(request);
    }

    public Gstr3bDto getGstr3b(GstReportRequest request) {
        return gstReportService.getGstr3b(request.getFilters());
    }

    public HsnSummaryResponse getHsnSummary(GstReportRequest request) {
        return gstReportService.getHsnSummary(request);
    }

    public ItcReportDto getItcReport(GstReportRequest request) {
        return gstReportService.getItcReport(request);
    }
}
