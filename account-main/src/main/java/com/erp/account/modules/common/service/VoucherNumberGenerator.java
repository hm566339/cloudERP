package com.erp.account.modules.common.service;

import java.time.LocalDate;
import java.util.UUID;

public interface VoucherNumberGenerator {

    String generateVoucherNo(UUID companyId, LocalDate voucherDate);
}
