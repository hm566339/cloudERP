package com.erp.account;

import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.repository.AuditLogRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@SpringBootTest
@ActiveProfiles("test")
public class AuditLogVerificationTest {

    @Autowired
    private GlJournalEntryRepository glJournalEntryRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testAuditLogCreation() throws Exception {
        Company company = companyRepository.findAll().stream().findFirst().orElseGet(() -> {
            Company c = new Company();
            c.setId(UUID.randomUUID());
            c.setCompanyName("Test Company");
            c.setBaseCurrency("USD");
            c.setActive(true);
            return companyRepository.saveAndFlush(c);
        });

        // Create a fake journal entry
        GlJournalEntry entry = new GlJournalEntry();
        entry.setCompany(company);
        entry.setVoucherNo("JV-TEST-" + (System.currentTimeMillis() % 1000000L));
        entry.setVoucherDate(LocalDate.now());
        entry.setStatus(PostingStatus.DRAFT);
        entry.setTotalDebit(new BigDecimal("1000.00"));
        entry.setTotalCredit(new BigDecimal("1000.00"));

        // Save it (this should trigger our HibernateAuditListener)
        entry = glJournalEntryRepository.saveAndFlush(entry);

        // Wait a small amount of time since audit logs might be async
        Thread.sleep(1000);

        // Fetch audit logs for this entity
        List<AuditLog> logs = auditLogRepository.findByEntityNameAndEntityIdOrderByPerformedAtDesc("GlJournalEntry", entry.getId());
        
        System.out.println("================ AUDIT LOG VERIFICATION ================");
        System.out.println("Found " + logs.size() + " audit logs for entity " + entry.getId());
        
        for (AuditLog log : logs) {
            System.out.println("Action: " + log.getActionType());
            System.out.println("Module: " + log.getModuleName());
            System.out.println("IP: " + log.getIpAddress());
            System.out.println("UserAgent: " + log.getUserAgent());
            System.out.println("OldValue: " + objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(log.getOldValue()));
            System.out.println("NewValue: " + objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(log.getNewValue()));
            System.out.println("--------------------------------------------------------");
        }
    }
}
