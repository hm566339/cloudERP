package com.erp.account.modules.expense.controller;

import com.erp.account.modules.expense.dto.report.ExpenseReportFilterRequest;
import com.erp.account.modules.expense.service.ExpenseReportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ExpenseReportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ExpenseReportService expenseReportService;

    @InjectMocks
    private ExpenseReportController expenseReportController;

    private final UUID companyId = UUID.randomUUID();
    private final UUID employeeId = UUID.randomUUID();
    private final UUID categoryId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(expenseReportController).build();
    }

    @Test
    void testSummaryNoFilters_Returns200() throws Exception {
        mockMvc.perform(get("/api/account/v1/expense-reports/summary")
                .param("companyId", companyId.toString()))
                .andExpect(status().isOk());
    }

    @Test
    void testSummaryWithEmployeeId_Returns200() throws Exception {
        mockMvc.perform(get("/api/account/v1/expense-reports/summary")
                .param("companyId", companyId.toString())
                .param("employeeId", employeeId.toString()))
                .andExpect(status().isOk());
    }

    @Test
    void testSummaryWithCategoryId_Returns200() throws Exception {
        mockMvc.perform(get("/api/account/v1/expense-reports/summary")
                .param("companyId", companyId.toString())
                .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk());
    }

    @Test
    void testSummaryWithPaymentTypeCash_Returns200() throws Exception {
        mockMvc.perform(get("/api/account/v1/expense-reports/summary")
                .param("companyId", companyId.toString())
                .param("paymentType", "CASH"))
                .andExpect(status().isOk());
    }

    @Test
    void testSummaryWithAllFilters_Returns200() throws Exception {
        mockMvc.perform(get("/api/account/v1/expense-reports/summary")
                .param("companyId", companyId.toString())
                .param("employeeId", employeeId.toString())
                .param("categoryId", categoryId.toString())
                .param("paymentType", "CASH"))
                .andExpect(status().isOk());
    }

    @Test
    void testStaffDriverWithFilters_Returns200AndEmptyList() throws Exception {
        when(expenseReportService.getStaffDriverAnalysis(any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/account/v1/expense-reports/staff-driver")
                .param("companyId", companyId.toString())
                .param("employeeId", employeeId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void testCategoryReportWithFilters_Returns200AndEmptyList() throws Exception {
        when(expenseReportService.getCategoryBreakdown(any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/account/v1/expense-reports/category")
                .param("companyId", companyId.toString())
                .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void testVehicleReportWithFilters_Returns200AndEmptyList() throws Exception {
        when(expenseReportService.getVehicleFleetExpenses(any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/account/v1/expense-reports/vehicles")
                .param("companyId", companyId.toString())
                .param("vehicleId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void testSalesOrderDcReportWithFilters_Returns200AndEmptyList() throws Exception {
        when(expenseReportService.getSalesOrderDcExpenses(any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/account/v1/expense-reports/sales-order-dc")
                .param("companyId", companyId.toString())
                .param("salesOrderId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }
}
