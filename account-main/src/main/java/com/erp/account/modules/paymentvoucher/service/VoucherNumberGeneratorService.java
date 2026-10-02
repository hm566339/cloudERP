package com.erp.account.modules.paymentvoucher.service;

import java.time.LocalDate;
import java.util.UUID;

public interface VoucherNumberGeneratorService {
    String generateNextVoucherNo(UUID companyId, LocalDate voucherDate);
}
