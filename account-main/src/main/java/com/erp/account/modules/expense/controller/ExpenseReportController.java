package com.erp.account.modules.expense.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.expense.dto.report.*;
import com.erp.account.modules.expense.service.ExpenseReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/v1/expense-reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Expense Reports API", description = "Endpoints for expense reports and analytics")
public class ExpenseReportController {

    private final ExpenseReportService expenseReportService;

    @GetMapping("/summary")
    @Operation(summary = "Get Expense Report Summary", description = "Get top-level KPI metrics for expenses and reimbursements")
    public ResponseEntity<ApiResponse<ExpenseReportSummaryResponse>> getSummary(
            @ModelAttribute ExpenseReportFilterRequest filter,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/expense-reports/summary");
        ExpenseReportSummaryResponse response = expenseReportService.getSummary(companyId, filter);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense report summary fetched successfully"));
    }

    @GetMapping("/staff-driver")
    @Operation(summary = "Get Staff & Driver Analysis", description = "Get expenses grouped by staff or driver")
    public ResponseEntity<ApiResponse<List<StaffDriverReportResponse>>> getStaffDriverAnalysis(
            @ModelAttribute ExpenseReportFilterRequest filter,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/expense-reports/staff-driver");
        List<StaffDriverReportResponse> response = expenseReportService.getStaffDriverAnalysis(companyId, filter);
        return ResponseEntity.ok(ApiResponse.success(response, "Staff & Driver report fetched successfully"));
    }

    @GetMapping("/category")
    @Operation(summary = "Get Category-wise Breakdown", description = "Get expenses grouped by expense category")
    public ResponseEntity<ApiResponse<List<CategoryExpenseReportResponse>>> getCategoryBreakdown(
            @ModelAttribute ExpenseReportFilterRequest filter,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/expense-reports/category");
        List<CategoryExpenseReportResponse> response = expenseReportService.getCategoryBreakdown(companyId, filter);
        return ResponseEntity.ok(ApiResponse.success(response, "Category report fetched successfully"));
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Get Vehicle & Fleet Expenses", description = "Get expenses grouped by vehicle")
    public ResponseEntity<ApiResponse<List<VehicleExpenseReportResponse>>> getVehicleFleetExpenses(
            @ModelAttribute ExpenseReportFilterRequest filter,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/expense-reports/vehicles");
        List<VehicleExpenseReportResponse> response = expenseReportService.getVehicleFleetExpenses(companyId, filter);
        return ResponseEntity.ok(ApiResponse.success(response, "Vehicle fleet report fetched successfully"));
    }

    @GetMapping("/sales-order-dc")
    @Operation(summary = "Get Sales Order & DC Linked Expenses", description = "Get expenses grouped by Sales Order or Delivery Challan")
    public ResponseEntity<ApiResponse<List<SalesOrderDcExpenseReportResponse>>> getSalesOrderDcExpenses(
            @ModelAttribute ExpenseReportFilterRequest filter,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/expense-reports/sales-order-dc");
        List<SalesOrderDcExpenseReportResponse> response = expenseReportService.getSalesOrderDcExpenses(companyId, filter);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Order & DC report fetched successfully"));
    }
}
