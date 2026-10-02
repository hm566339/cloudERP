// package com.erp.account.audit;

// import com.erp.account.common.dto.request.RequestWrapper;
// import com.erp.account.modules.company.dto.request.CompanyRequest;
// import com.erp.account.modules.company.entity.Company;
// import com.erp.account.modules.company.repository.CompanyRepository;
// import com.erp.account.modules.auditlog.repository.AuditLogRepository;
// import com.erp.account.modules.auditlog.entity.AuditLog;
// import org.junit.jupiter.api.AfterEach;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.MediaType;
// import org.springframework.test.web.servlet.ResultActions;

// import java.util.List;
// import java.util.UUID;

// import static org.assertj.core.api.Assertions.assertThat;
// import static
// org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
// import static
// org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// public class AuditIntegrationTest extends BaseAuditIntegrationTest {

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
// void testCreateCompany_AuditsCorrectly() throws Exception {
// loginAsMohit();

// CompanyRequest companyRequest = CompanyRequest.builder()
// .companyCode("TESTCOMP")
// .companyName("Test Company Inc")
// .gstin("27AADCB2230M1Z2")
// .baseCurrency("INR")
// .email("test@example.com")
// .phone("1234567890")
// .pan("AADCB2230M")
// .build();

// RequestWrapper<CompanyRequest> wrapper = new RequestWrapper<>();
// wrapper.setData(companyRequest);

// ResultActions result = mockMvc.perform(post("/api/account/companies")
// .contentType(MediaType.APPLICATION_JSON)
// .content(objectMapper.writeValueAsString(wrapper)));

// result.andExpect(status().isOk())
// .andExpect(jsonPath("$.data.audit.created.by.id").value(MOHIT_ID.toString()))
// .andExpect(jsonPath("$.data.audit.created.by.username").value(MOHIT_USERNAME))
// .andExpect(jsonPath("$.data.audit.created.at").exists());

// List<Company> companies = companyRepository.findAll();
// assertThat(companies).hasSize(1);
// Company company = companies.get(0);
// assertThat(company.getCreatedBy()).isEqualTo(MOHIT_ID);
// assertThat(company.getCreatedByUsername()).isEqualTo(MOHIT_USERNAME);

// List<AuditLog> auditLogs = auditLogRepository.findAll();
// assertThat(auditLogs).hasSize(1);
// assertThat(auditLogs.get(0).getAction()).isEqualTo("CREATE");
// assertThat(auditLogs.get(0).getPerformedBy()).isEqualTo(MOHIT_ID);
// assertThat(auditLogs.get(0).getPerformedByUsername()).isEqualTo(MOHIT_USERNAME);
// }

// @Test
// void testUpdateCompany_AuditsCorrectlyWithDifferentUser() throws Exception {
// // 1. Create with Mohit
// loginAsMohit();
// Company company = new Company();
// company.setCompanyCode("UPDATECODE");
// company.setCompanyName("Original Name");
// company.setGstin("27AADCB2230M1Z2");
// company.setBaseCurrency("INR");
// company.setCreatedBy(MOHIT_ID);
// company.setCreatedByUsername(MOHIT_USERNAME);
// company = companyRepository.save(company);

// // Clear audit logs generated manually
// auditLogRepository.deleteAllInBatch();

// // 2. Update with Rahul
// loginAsRahul();
// CompanyRequest updateReq = CompanyRequest.builder()
// .companyCode("UPDATECODE")
// .companyName("Updated Name")
// .gstin("27AADCB2230M1Z2")
// .baseCurrency("INR")
// .email("updated@example.com")
// .build();
// RequestWrapper<CompanyRequest> wrapper = new RequestWrapper<>();
// wrapper.setData(updateReq);

// ResultActions result = mockMvc.perform(put("/api/account/companies/" +
// company.getId())
// .contentType(MediaType.APPLICATION_JSON)
// .content(objectMapper.writeValueAsString(wrapper)));

// result.andExpect(status().isOk())
// .andExpect(jsonPath("$.data.audit.created.by.username").value(MOHIT_USERNAME))
// .andExpect(jsonPath("$.data.audit.updated.by.id").value(RAHUL_ID.toString()))
// .andExpect(jsonPath("$.data.audit.updated.by.username").value(RAHUL_USERNAME));

// // 3. Verify DB
// Company updatedCompany =
// companyRepository.findById(company.getId()).orElseThrow();
// assertThat(updatedCompany.getCreatedByUsername()).isEqualTo(MOHIT_USERNAME);
// assertThat(updatedCompany.getUpdatedByUsername()).isEqualTo(RAHUL_USERNAME);

// // 4. Verify Field History in AuditLog
// List<AuditLog> logs = auditLogRepository.findAll();
// assertThat(logs).hasSize(1);
// AuditLog log = logs.get(0);
// assertThat(log.getAction()).isEqualTo("UPDATE");
// assertThat(log.getPerformedByUsername()).isEqualTo(RAHUL_USERNAME);
// assertThat(log.getChanges()).contains("\"old\":\"Original Name\"");
// assertThat(log.getChanges()).contains("\"new\":\"Updated Name\"");
// }

// @Test
// void testSoftDelete_AuditsCorrectly() throws Exception {
// loginAsMohit();
// Company company = new Company();
// company.setCompanyCode("DELCODE");
// company.setCompanyName("To Be Deleted");
// company.setGstin("27AADCB2230M1Z2");
// company.setBaseCurrency("INR");
// company = companyRepository.save(company);
// auditLogRepository.deleteAllInBatch();

// ResultActions result = mockMvc.perform(delete("/api/account/companies/" +
// company.getId()));
// result.andExpect(status().isOk());

// Company deletedCompany =
// companyRepository.findById(company.getId()).orElseThrow();
// assertThat(deletedCompany.getIsDeleted()).isTrue();
// assertThat(deletedCompany.getDeletedBy()).isEqualTo(MOHIT_ID);
// assertThat(deletedCompany.getDeletedByUsername()).isEqualTo(MOHIT_USERNAME);
// assertThat(deletedCompany.getDeletedAt()).isNotNull();

// List<AuditLog> logs = auditLogRepository.findAll();
// assertThat(logs).hasSize(1);
// assertThat(logs.get(0).getAction()).isEqualTo("DELETE");
// assertThat(logs.get(0).getPerformedByUsername()).isEqualTo(MOHIT_USERNAME);
// }

// @Test
// void testListResponse_ContainsAudit() throws Exception {
// loginAsMohit();
// Company company1 = new Company();
// company1.setCompanyCode("L1");
// company1.setCompanyName("List 1");
// company1.setGstin("27AADCB2230M1Z2");
// company1.setBaseCurrency("INR");

// Company company2 = new Company();
// company2.setCompanyCode("L2");
// company2.setCompanyName("List 2");
// company2.setGstin("27AADCB2230M1Z2");
// company2.setBaseCurrency("INR");

// companyRepository.saveAll(List.of(company1, company2));

// mockMvc.perform(get("/api/account/companies"))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.data.content[0].audit").exists())
// .andExpect(jsonPath("$.data.content[1].audit").exists());
// }
// }
