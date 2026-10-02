// package com.erp.account.audit;

// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.company.repository.CompanyRepository;
// import com.erp.account.modules.auditlog.repository.AuditLogRepository;
// import com.erp.account.modules.auditlog.entity.AuditLog;
// import org.junit.jupiter.api.AfterEach;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.transaction.annotation.Transactional;

// import java.util.ArrayList;
// import java.util.List;

// import static org.assertj.core.api.Assertions.assertThat;

// public class AuditComplexOperationsTest extends BaseAuditIntegrationTest {

// @Autowired
// private CompanyRepository companyRepository;

// @Autowired
// private AuditLogRepository auditLogRepository;

// @BeforeEach
// void setUp() {
// auditLogRepository.deleteAllInBatch();
// companyRepository.deleteAllInBatch();
// }

// @AfterEach
// void tearDown() {
// auditLogRepository.deleteAllInBatch();
// companyRepository.deleteAllInBatch();
// logout();
// }

// @Test
// void testBulkSave_AuditsCorrectly() {
// loginAsMohit();
// List<Company> companies = new ArrayList<>();
// for (int i = 0; i < 10; i++) {
// Company c = new Company();
// c.setCompanyCode("C" + i);
// c.setCompanyName("Company " + i);
// c.setGstin("27AADCB2230M1Z2");
// c.setBaseCurrency("INR");
// companies.add(c);
// }

// companyRepository.saveAll(companies);

// List<Company> savedCompanies = companyRepository.findAll();
// assertThat(savedCompanies).hasSize(10);
// assertThat(savedCompanies).allMatch(c -> c.getCreatedBy().equals(MOHIT_ID));

// List<AuditLog> logs = auditLogRepository.findAll();
// assertThat(logs).hasSize(10);
// assertThat(logs).allMatch(l -> l.getAction().equals("CREATE") &&
// l.getPerformedBy().equals(MOHIT_ID));
// }

// @Test
// void testTransactionRollback_AuditIsRolledBack() {
// loginAsMohit();

// try {
// executeTransactionalFailure();
// } catch (Exception e) {
// // Expected exception
// }

// // Verify both business and audit are rolled back
// List<Company> companies = companyRepository.findAll();
// assertThat(companies).isEmpty();

// List<AuditLog> logs = auditLogRepository.findAll();
// assertThat(logs).isEmpty(); // StatelessSession should participate in
// rollback or rollback automatically.
// }

// @Transactional
// public void executeTransactionalFailure() {
// Company c = new Company();
// c.setCompanyCode("FAIL");
// c.setCompanyName("Fail Company");
// c.setGstin("27AADCB2230M1Z2");
// c.setBaseCurrency("INR");
// companyRepository.save(c);

// // Force rollback
// throw new RuntimeException("Intentional failure for rollback test");
// }
// }
