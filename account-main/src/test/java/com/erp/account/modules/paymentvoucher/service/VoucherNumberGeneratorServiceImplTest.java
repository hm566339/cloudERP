package com.erp.account.modules.paymentvoucher.service;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.impl.VoucherNumberGeneratorServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VoucherNumberGeneratorServiceImplTest {

    @Mock
    private PaymentVoucherRepository paymentVoucherRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private VoucherNumberGeneratorServiceImpl generatorService;

    private UUID companyId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
    }

    @Test
    void testGenerateFirstVoucher() {
        LocalDate date = LocalDate.of(2026, 8, 15);
        when(companyRepository.findByIdForUpdate(companyId)).thenReturn(Optional.of(new Company()));
        when(paymentVoucherRepository.findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(eq(companyId), eq("PV-2026-08-")))
                .thenReturn(Optional.empty());

        String result = generatorService.generateNextVoucherNo(companyId, date);

        assertEquals("PV-2026-08-000001", result);
        verify(companyRepository).findByIdForUpdate(companyId);
    }

    @Test
    void testSequentialGeneration() {
        LocalDate date = LocalDate.of(2026, 8, 15);
        when(companyRepository.findByIdForUpdate(companyId)).thenReturn(Optional.of(new Company()));
        
        PaymentVoucher latestVoucher = new PaymentVoucher();
        latestVoucher.setVoucherNo("PV-2026-08-000042");
        when(paymentVoucherRepository.findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(eq(companyId), eq("PV-2026-08-")))
                .thenReturn(Optional.of(latestVoucher));

        String result = generatorService.generateNextVoucherNo(companyId, date);

        assertEquals("PV-2026-08-000043", result);
    }

    @Test
    void testMonthlyReset() {
        LocalDate augustDate = LocalDate.of(2026, 8, 15);
        LocalDate septemberDate = LocalDate.of(2026, 9, 1);
        
        when(companyRepository.findByIdForUpdate(companyId)).thenReturn(Optional.of(new Company()));
        
        PaymentVoucher latestAugustVoucher = new PaymentVoucher();
        latestAugustVoucher.setVoucherNo("PV-2026-08-000100");
        when(paymentVoucherRepository.findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(eq(companyId), eq("PV-2026-08-")))
                .thenReturn(Optional.of(latestAugustVoucher));
                
        when(paymentVoucherRepository.findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(eq(companyId), eq("PV-2026-09-")))
                .thenReturn(Optional.empty());

        String augResult = generatorService.generateNextVoucherNo(companyId, augustDate);
        String sepResult = generatorService.generateNextVoucherNo(companyId, septemberDate);

        assertEquals("PV-2026-08-000101", augResult);
        assertEquals("PV-2026-09-000001", sepResult);
    }

    @Test
    void testConcurrentRequestsUseLocking() {
        LocalDate date = LocalDate.of(2026, 8, 15);
        when(companyRepository.findByIdForUpdate(companyId)).thenReturn(Optional.of(new Company()));
        when(paymentVoucherRepository.findFirstByCompanyIdAndVoucherNoStartingWithOrderByVoucherNoDesc(any(), anyString()))
                .thenReturn(Optional.empty());

        // Call the service method
        generatorService.generateNextVoucherNo(companyId, date);

        // Verify the lock was explicitly requested
        verify(companyRepository, times(1)).findByIdForUpdate(companyId);
    }
}
