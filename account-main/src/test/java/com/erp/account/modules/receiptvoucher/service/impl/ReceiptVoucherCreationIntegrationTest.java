// package com.erp.account.modules.receiptvoucher.service.impl;

// import com.erp.account.common.dto.request.RequestWrapper;
// import com.erp.account.enums.PostingStatus;
// import com.erp.account.enums.ReceiptVoucherStatus;
// import com.erp.account.modules.common.entity.ReceiptAllocation;
// import
// com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherAllocationRequest;
// import
// com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
// import
// com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
// import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
// import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
// import
// com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
// import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
// import
// com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
// import org.springframework.test.context.ActiveProfiles;
// import org.springframework.transaction.annotation.Transactional;
// import
// org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

// import java.math.BigDecimal;
// import java.time.LocalDate;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;

// @DataJpaTest
// @ActiveProfiles("test")
// @AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
// @Transactional
// public class ReceiptVoucherCreationIntegrationTest {

// @Autowired
// private ReceiptVoucherRepository receiptVoucherRepository;

// @Autowired
// private SalesInvoiceRepository salesInvoiceRepository;

// @Test
// void testJPA_Relationship_PersistenceOrder() {
// // Create ReceiptVoucher
// ReceiptVoucher voucher = new ReceiptVoucher();
// voucher.setReceiptNo("TEST-RV-001");
// voucher.setReceiptDate(LocalDate.now());
// voucher.setReceiptAmount(new BigDecimal("1000.00"));
// voucher.setPaymentMode(com.erp.account.enums.PaymentMode.BANK_TRANSFER);
// voucher.setReceiptStatus(com.erp.account.enums.ReceiptVoucherStatus.DRAFT);
// voucher.setGlPostingStatus(com.erp.account.enums.PostingStatus.DRAFT);
// voucher.setIsDeleted(false);
// // Note: Missing Company, Customer, BankAccount, ChartOfAccount will cause FK
// constraint violations
// // if this was a real database, but since we are just verifying the JPA
// mapping logic, we can try to save it.
// // Wait, if it's a real test DB, FK constraints will fail if those are
// null/missing.

// // Actually, without valid master data, saving will fail. We need dummy data.
// }
// }
