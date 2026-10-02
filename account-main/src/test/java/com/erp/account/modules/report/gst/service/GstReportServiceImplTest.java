package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.dto.Gstr3bDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GstReportServiceImplTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @InjectMocks
    private GstReportServiceImpl gstReportService;

    @BeforeEach
    void setUp() {
        com.erp.account.security.CurrentUserContext.setCompanyId(UUID.randomUUID());
        com.erp.account.security.CurrentUserContext.setUserId(UUID.randomUUID());
        ReflectionTestUtils.setField(gstReportService, "entityManager", entityManager);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
    }

    @Test
    void testGetGstr3b_Success() {
        GstReportFilterDto filter = new GstReportFilterDto();
        filter.setFromDate(LocalDate.now().minusDays(30));
        filter.setToDate(LocalDate.now());
        
        Gstr3bDto result = gstReportService.getGstr3b(filter);

        assertNotNull(result);
        assertNotNull(result.getInwardReverseChargeSupplies());
        assertNotNull(result.getInputTaxCredit().getItcReversed().getSection175());
    }
}
