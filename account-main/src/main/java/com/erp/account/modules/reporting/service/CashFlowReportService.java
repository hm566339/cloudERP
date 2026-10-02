package com.erp.account.modules.reporting.service;

import com.erp.account.modules.reporting.dto.response.CashFlowReportResponse;
import org.springframework.stereotype.Service;

import com.erp.account.modules.reporting.dto.request.CashFlowRequest;
import java.time.LocalDate;
import java.util.UUID;

@Service
public interface CashFlowReportService {
    CashFlowReportResponse getCashFlowReport(CashFlowRequest request);
}
