// package com.erp.account.modules.expense.controller;

// import com.erp.account.common.dto.response.ApiResponse;
// import com.erp.account.enums.ExpenseRequestStatus;
// import com.erp.account.enums.RequestType;
// import com.erp.account.enums.RoleType;
// import com.erp.account.modules.expense.dto.*;
// import com.erp.account.modules.expense.service.ExpenseRequestService;
// import com.fasterxml.jackson.databind.ObjectMapper;
// import com.fasterxml.jackson.databind.node.ObjectNode;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.Spy;
// import org.mockito.junit.jupiter.MockitoExtension;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.PageImpl;
// import org.springframework.data.domain.PageRequest;
// import org.springframework.data.domain.Pageable;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;

// import java.math.BigDecimal;
// import java.time.LocalDate;
// import java.util.List;
// import java.util.UUID;

// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.ArgumentMatchers.eq;
// import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class)
// public class ExpenseRequestControllerTest {

// @Mock
// private ExpenseRequestService expenseRequestService;

// @Spy
// private ObjectMapper objectMapper = new ObjectMapper().registerModule(new
// com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

// @InjectMocks
// private ExpenseRequestController expenseRequestController;

// private UUID companyId;
// private UUID requestId;
// private ExpenseRequestResponse sampleResponse;

// @BeforeEach
// void setUp() {
// companyId = UUID.randomUUID();
// requestId = UUID.randomUUID();

// sampleResponse = ExpenseRequestResponse.builder()
// .id(requestId)
// .companyId(companyId)
// .requestNumber("ER-2026-0001")
// .requestType(RequestType.EXPENSE_REQUEST)
// .date(LocalDate.of(2026, 9, 4))
// .employeeDriverId(UUID.randomUUID())
// .roleType(RoleType.DRIVER)
// .categoryId(UUID.randomUUID())
// .categoryName("Fuel")
// .requestedAmount(new BigDecimal("2000.00"))
// .purposeDescription("Customer delivery")
// .status(ExpenseRequestStatus.DRAFT)
// .build();
// }

// @Test
// void testCreateExpenseRequestEndpoint_WrappedPayload() throws Exception {
// when(expenseRequestService.createExpenseRequest(eq(companyId),
// any(ExpenseRequestCreateRequest.class)))
// .thenReturn(sampleResponse);

// ObjectNode root = objectMapper.createObjectNode();
// ObjectNode data = root.putObject("data");
// data.put("requestType", "EXPENSE_REQUEST");
// data.put("date", "2026-09-04");
// data.put("employeeDriverId", UUID.randomUUID().toString());
// data.put("roleType", "DRIVER");
// data.put("categoryId", UUID.randomUUID().toString());
// data.put("requestedAmount", 2000.00);
// data.put("purposeDescription", "Customer delivery");

// ResponseEntity<ApiResponse<ExpenseRequestResponse>> response =
// expenseRequestController.createExpenseRequest(root, companyId);

// assertEquals(HttpStatus.CREATED, response.getStatusCode());
// assertNotNull(response.getBody());
// assertTrue(response.getBody().isSuccess());
// assertEquals("ER-2026-0001",
// response.getBody().getData().getRequestNumber());
// }

// @Test
// void testGetExpenseRequestByIdEndpoint() {
// when(expenseRequestService.getExpenseRequestById(companyId,
// requestId)).thenReturn(sampleResponse);

// ResponseEntity<ApiResponse<ExpenseRequestResponse>> response =
// expenseRequestController.getExpenseRequestById(requestId, companyId);

// assertEquals(HttpStatus.OK, response.getStatusCode());
// assertTrue(response.getBody().isSuccess());
// assertEquals(requestId, response.getBody().getData().getId());
// }

// @Test
// void testGetAllExpenseRequestsEndpoint() {
// Page<ExpenseRequestResponse> page = new PageImpl<>(List.of(sampleResponse),
// PageRequest.of(0, 10), 1);
// when(expenseRequestService.getAllExpenseRequests(eq(companyId), any(),
// any(Pageable.class)))
// .thenReturn(page);

// ResponseEntity<ApiResponse<List<ExpenseRequestResponse>>> response =
// expenseRequestController.getAllExpenseRequests(companyId, new
// ExpenseRequestFilterDto(), PageRequest.of(0, 10));

// assertEquals(HttpStatus.OK, response.getStatusCode());
// assertTrue(response.getBody().isSuccess());
// assertNotNull(response.getBody().getPagination());
// assertEquals(1, response.getBody().getPagination().getTotalElements());
// }

// @Test
// void testApproveEndpoint_WithBody() throws Exception {
// sampleResponse.setStatus(ExpenseRequestStatus.APPROVED);
// sampleResponse.setApprovedAmount(new BigDecimal("1800.00"));

// when(expenseRequestService.approveExpenseRequest(eq(companyId),
// eq(requestId), any()))
// .thenReturn(sampleResponse);

// ObjectNode root = objectMapper.createObjectNode();
// ObjectNode data = root.putObject("data");
// data.put("approvedAmount", 1800.00);
// data.put("remarks", "Approved with discount");

// ResponseEntity<ApiResponse<ExpenseRequestResponse>> response =
// expenseRequestController.approveExpenseRequest(requestId, root, companyId);

// assertEquals(HttpStatus.OK, response.getStatusCode());
// assertEquals(ExpenseRequestStatus.APPROVED,
// response.getBody().getData().getStatus());
// assertEquals(new BigDecimal("1800.00"),
// response.getBody().getData().getApprovedAmount());
// }

// @Test
// void testRejectEndpoint() throws Exception {
// sampleResponse.setStatus(ExpenseRequestStatus.REJECTED);
// sampleResponse.setRejectionReason("Budget exceeded");

// when(expenseRequestService.rejectExpenseRequest(eq(companyId), eq(requestId),
// any()))
// .thenReturn(sampleResponse);

// ObjectNode root = objectMapper.createObjectNode();
// ObjectNode data = root.putObject("data");
// data.put("reason", "Budget exceeded");

// ResponseEntity<ApiResponse<ExpenseRequestResponse>> response =
// expenseRequestController.rejectExpenseRequest(requestId, root, companyId);

// assertEquals(HttpStatus.OK, response.getStatusCode());
// assertEquals(ExpenseRequestStatus.REJECTED,
// response.getBody().getData().getStatus());
// }

// @Test
// void testSubmitEndpoint() {
// sampleResponse.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
// when(expenseRequestService.submitExpenseRequest(companyId,
// requestId)).thenReturn(sampleResponse);

// ResponseEntity<ApiResponse<ExpenseRequestResponse>> response =
// expenseRequestController.submitExpenseRequest(requestId, companyId);

// assertEquals(HttpStatus.OK, response.getStatusCode());
// assertEquals(ExpenseRequestStatus.PENDING_APPROVAL,
// response.getBody().getData().getStatus());
// }

// @Test
// void testCancelEndpoint() {
// sampleResponse.setStatus(ExpenseRequestStatus.CANCELLED);
// when(expenseRequestService.cancelExpenseRequest(companyId,
// requestId)).thenReturn(sampleResponse);

// ResponseEntity<ApiResponse<ExpenseRequestResponse>> response =
// expenseRequestController.cancelExpenseRequest(requestId, companyId);

// assertEquals(HttpStatus.OK, response.getStatusCode());
// assertEquals(ExpenseRequestStatus.CANCELLED,
// response.getBody().getData().getStatus());
// }
// }
