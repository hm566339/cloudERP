package com.erp.account.modules.reporting.service;

import com.erp.account.common.exception.BusinessException;
import com.erp.account.enums.AccountNature;
import com.erp.account.enums.BalanceType;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.report.dto.response.GeneralLedgerResponse;
import com.erp.account.modules.report.dto.response.LedgerTransactionResponse;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GeneralLedgerServiceImplTest {

    @Mock
    private GlJournalLineRepository glJournalLineRepository;

    @Mock
    private CompanyService companyService;

    @Mock
    private ChartOfAccountRepository chartOfAccountRepository;

    @InjectMocks
    private GeneralLedgerServiceImpl generalLedgerService;

    private UUID companyId;
    private UUID accountId;
    private GeneralLedgerRequest request;
    private CompanyResponse companyResponse;
    private Company company;
    private ChartOfAccount debitAccount;
    private ChartOfAccount creditAccount;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        accountId = UUID.randomUUID();
        com.erp.account.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.account.security.CurrentUserContext.setUserId(UUID.randomUUID());

        request = new GeneralLedgerRequest();
        request.setAccountId(accountId);
        request.setFromDate(LocalDate.now().minusDays(10));
        request.setToDate(LocalDate.now());
        request.setIncludeOpening(true);

        companyResponse = mock(CompanyResponse.class);
        lenient().when(companyResponse.getId()).thenReturn(companyId);
        lenient().when(companyResponse.getCompanyName()).thenReturn("Test Company");
        lenient().when(companyResponse.getBaseCurrency()).thenReturn("INR");

        company = new Company();
        company.setId(companyId);

        debitAccount = new ChartOfAccount();
        debitAccount.setId(accountId);
        debitAccount.setCompany(company);
        debitAccount.setAccountType(AccountNature.DEBIT);
        debitAccount.setAccountCode("100008");

        creditAccount = new ChartOfAccount();
        creditAccount.setId(accountId);
        creditAccount.setCompany(company);
        creditAccount.setAccountType(AccountNature.CREDIT);
        creditAccount.setAccountCode("400001");
    }

    @Test
    void testMissingAccountId_ThrowsException() {
        request.setAccountId(null);
        assertThrows(BusinessException.class, () -> {
            generalLedgerService.generateGeneralLedger(request, companyId);
        });
    }

    @Test
    void testDebitNatureAccount_RunningBalanceCalculation() {
        when(companyService.getCompany(companyId)).thenReturn(companyResponse);
        when(chartOfAccountRepository.findById(accountId)).thenReturn(Optional.of(debitAccount));
        
        // Mock opening balance lines (100 Debit)
        GlJournalLine openingLine = new GlJournalLine();
        openingLine.setDebitAmount(BigDecimal.valueOf(100));
        openingLine.setCreditAmount(BigDecimal.ZERO);
        when(glJournalLineRepository.findAll(any(Specification.class))).thenReturn(List.of(openingLine)); 
                
        // Mock main lines
        GlJournalLine txLine1 = new GlJournalLine();
        txLine1.setAccount(debitAccount);
        txLine1.setDebitAmount(BigDecimal.valueOf(50));
        txLine1.setCreditAmount(BigDecimal.ZERO);
        
        GlJournalLine txLine2 = new GlJournalLine();
        txLine2.setAccount(debitAccount);
        txLine2.setDebitAmount(BigDecimal.ZERO);
        txLine2.setCreditAmount(BigDecimal.valueOf(200));

        when(glJournalLineRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(txLine1, txLine2));

        GeneralLedgerResponse response = generalLedgerService.generateGeneralLedger(request, companyId);
        
        // Opening balance should be 100 DR
        assertNotNull(response.getOpeningBalance());
        assertEquals(0, BigDecimal.valueOf(100).compareTo(response.getOpeningBalance().getAmount()));
        assertEquals(BalanceType.DR, response.getOpeningBalance().getBalanceType());
        
        // Transaction 1: +50 -> 150 DR
        LedgerTransactionResponse t1 = response.getTransactions().get(0);
        assertEquals(0, BigDecimal.valueOf(150).compareTo(t1.getRunningBalance().getAmount()));
        assertEquals(BalanceType.DR, t1.getRunningBalance().getBalanceType());
        
        // Transaction 2: -200 -> -50 -> 50 CR
        LedgerTransactionResponse t2 = response.getTransactions().get(1);
        assertEquals(0, BigDecimal.valueOf(50).compareTo(t2.getRunningBalance().getAmount()));
        assertEquals(BalanceType.CR, t2.getRunningBalance().getBalanceType());
    }
    
    @Test
    void testCreditNatureAccount_RunningBalanceCalculation() {
        when(companyService.getCompany(companyId)).thenReturn(companyResponse);
        when(chartOfAccountRepository.findById(accountId)).thenReturn(Optional.of(creditAccount));
        
        // Mock opening balance lines (100 Credit)
        GlJournalLine openingLine = new GlJournalLine();
        openingLine.setDebitAmount(BigDecimal.ZERO);
        openingLine.setCreditAmount(BigDecimal.valueOf(100));
        when(glJournalLineRepository.findAll(any(Specification.class))).thenReturn(List.of(openingLine));
                
        // Mock main lines
        GlJournalLine txLine1 = new GlJournalLine();
        txLine1.setAccount(creditAccount);
        txLine1.setDebitAmount(BigDecimal.ZERO);
        txLine1.setCreditAmount(BigDecimal.valueOf(50));
        
        GlJournalLine txLine2 = new GlJournalLine();
        txLine2.setAccount(creditAccount);
        txLine2.setDebitAmount(BigDecimal.valueOf(200));
        txLine2.setCreditAmount(BigDecimal.ZERO);

        when(glJournalLineRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(txLine1, txLine2));

        GeneralLedgerResponse response = generalLedgerService.generateGeneralLedger(request, companyId);
        
        // Opening balance should be 100 CR
        assertNotNull(response.getOpeningBalance());
        assertEquals(0, BigDecimal.valueOf(100).compareTo(response.getOpeningBalance().getAmount()));
        assertEquals(BalanceType.CR, response.getOpeningBalance().getBalanceType());
        
        // Transaction 1: +50 -> 150 CR
        LedgerTransactionResponse t1 = response.getTransactions().get(0);
        assertEquals(0, BigDecimal.valueOf(150).compareTo(t1.getRunningBalance().getAmount()));
        assertEquals(BalanceType.CR, t1.getRunningBalance().getBalanceType());
        
        // Transaction 2: -200 -> -50 -> 50 DR
        LedgerTransactionResponse t2 = response.getTransactions().get(1);
        assertEquals(0, BigDecimal.valueOf(50).compareTo(t2.getRunningBalance().getAmount()));
        assertEquals(BalanceType.DR, t2.getRunningBalance().getBalanceType());
    }

    @Test
    void testPage2Calculation() {
        when(companyService.getCompany(companyId)).thenReturn(companyResponse);
        when(chartOfAccountRepository.findById(accountId)).thenReturn(Optional.of(debitAccount));
        
        when(glJournalLineRepository.findAll(any(Specification.class))).thenReturn(new ArrayList<>()); // no opening balance
        
        // Create 3 lines
        List<GlJournalLine> lines = new ArrayList<>();
        for (int i=0; i<3; i++) {
            GlJournalLine l = new GlJournalLine();
            l.setAccount(debitAccount);
            l.setDebitAmount(BigDecimal.valueOf(100)); // +100 each
            l.setCreditAmount(BigDecimal.ZERO);
            lines.add(l);
        }
        
        when(glJournalLineRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(lines);
        
        request.setPage(1); // Page 2
        request.setPageSize(2);
        
        GeneralLedgerResponse response = generalLedgerService.generateGeneralLedger(request, companyId);
        
        assertEquals(1, response.getTransactions().size()); // 3 items, page size 2, page 1 has 1 item
        
        LedgerTransactionResponse t = response.getTransactions().get(0);
        
        // The running balance for the 3rd item should be 300, even though it's on page 2.
        assertEquals(0, BigDecimal.valueOf(300).compareTo(t.getRunningBalance().getAmount()));
    }
}
