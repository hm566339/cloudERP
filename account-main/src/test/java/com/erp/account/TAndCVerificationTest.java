package com.erp.account;

import com.erp.account.modules.settings.entity.TermsCondition;
import com.erp.account.modules.settings.repository.TermsConditionRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.common.enums.SalesDocumentType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TAndCVerificationTest {

    @Autowired
    private TermsConditionRepository termsConditionRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Test
    @Transactional
    public void verifyTermsAndConditionsCRUD() {
        Company company = new Company();
        company.setId(UUID.randomUUID());
        company.setCompanyName("T&C Test Company");
        company.setBaseCurrency("USD");
        company.setActive(true);
        company = companyRepository.saveAndFlush(company);

        UUID companyId = company.getId();
        
        System.out.println("--- STEP 3: T&C CRUD ---");
        // Create QUOTATION T&C
        TermsCondition tcQuotation = TermsCondition.builder()
                .companyId(companyId)
                .title("Quotation Test T&C")
                .content("QUOTATION TEST TERMS V1")
                .isDefault(true)
                .isActive(true)
                .documentType(SalesDocumentType.QUOTATION)
                .build();
        tcQuotation = termsConditionRepository.save(tcQuotation);
        assertNotNull(tcQuotation.getId());
        System.out.println("QUOTATION T&C Created: PASS");

        // Create SALES_ORDER T&C
        TermsCondition tcSalesOrder = TermsCondition.builder()
                .companyId(companyId)
                .title("SO Test T&C")
                .content("SO TEST TERMS V1")
                .isDefault(true)
                .isActive(true)
                .documentType(SalesDocumentType.SALES_ORDER)
                .build();
        tcSalesOrder = termsConditionRepository.save(tcSalesOrder);
        assertNotNull(tcSalesOrder.getId());
        System.out.println("SALES_ORDER T&C Created: PASS");
        
        System.out.println("--- STEP 4: VERIFY DOCUMENT TYPE FILTERING ---");
        List<TermsCondition> quotationTcs = termsConditionRepository.findByCompanyIdAndDocumentTypeAndIsDeletedFalse(companyId, SalesDocumentType.QUOTATION);
        assertEquals(1, quotationTcs.size());
        assertEquals("QUOTATION TEST TERMS V1", quotationTcs.get(0).getContent());
        System.out.println("DocumentType Filtering: PASS");
    }
}
