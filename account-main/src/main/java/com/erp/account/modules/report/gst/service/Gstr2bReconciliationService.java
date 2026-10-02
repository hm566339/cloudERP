package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationDto;
import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationRequest;

public interface Gstr2bReconciliationService {
    Gstr2bReconciliationDto reconcileGstr2b(Gstr2bReconciliationRequest request);
}
