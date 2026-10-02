package com.erp.account.modules.salesorder.service;

import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SalesOrderServiceSearchTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private SalesOrderMapper salesOrderMapper;

    @InjectMocks
    private SalesOrderServiceImpl salesOrderService;

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    private UUID companyId;

    @BeforeAll
    public static void setupTenantUtils() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
    }

    @AfterAll
    public static void teardownTenantUtils() {
        tenantUtilsMock.close();
    }

    @BeforeEach
    public void setup() {
        companyId = UUID.randomUUID();
        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
    }

    @Test
    public void getAllSalesOrders_shouldReturnPaginatedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        SalesOrder so = new SalesOrder();
        so.setId(UUID.randomUUID());
        
        Page<SalesOrder> mockPage = new PageImpl<>(List.of(so), pageable, 1);
        
        when(salesOrderRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);
        when(salesOrderMapper.toResponse(so)).thenReturn(new SalesOrderResponse());

        Page<SalesOrderResponse> result = salesOrderService.getAllSalesOrders(
                companyId,
                pageable,
                SalesOrderStatus.DRAFT,
                UUID.randomUUID(),
                LocalDate.now().minusDays(7),
                LocalDate.now(),
                "SO-001"
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(salesOrderRepository, times(1)).findAll(any(Specification.class), eq(pageable));
    }
}
