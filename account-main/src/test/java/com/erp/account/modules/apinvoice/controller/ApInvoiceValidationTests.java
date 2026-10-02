package com.erp.account.modules.apinvoice.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.service.ApInvoicePdfService;
import com.erp.account.modules.apinvoice.service.ApInvoiceService;
import com.erp.account.common.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class ApInvoiceValidationTests {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Mock
    private ApInvoiceService apInvoiceService;

    @Mock
    private ApInvoicePdfService apInvoicePdfService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private ApInvoiceController apInvoiceController;

    private UUID validVendorId = UUID.randomUUID();
    private UUID validProductId = UUID.randomUUID();
    private UUID validWarehouseId = UUID.randomUUID();
    private UUID validLocationId = UUID.randomUUID();
    private UUID validExpenseAccountId = UUID.randomUUID();
        private UUID validPlaceOfSupplyStateId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(apInvoiceController)
                .setValidator(validator)
                .build();
                
        ApInvoiceResponse mockResponse = new ApInvoiceResponse();
        mockResponse.setId(UUID.randomUUID());
        Mockito.lenient().when(apInvoiceService.createInvoice(any(), any())).thenReturn(mockResponse);
    }

    private ApInvoiceRequest buildBaseRequest() {
        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setVendorId(validVendorId);
        req.setInvoiceDate(LocalDate.now());
        req.setDueDate(LocalDate.now().plusDays(30));
        req.setPlaceOfSupplyStateId(validPlaceOfSupplyStateId);
        req.setSubtotal(BigDecimal.valueOf(1000));
        req.setTaxAmount(BigDecimal.ZERO);
        req.setTotalAmount(BigDecimal.valueOf(1000));
        req.setItems(new ArrayList<>());
        return req;
    }

    private RequestWrapper<ApInvoiceRequest> wrap(ApInvoiceRequest req) {
        RequestWrapper<ApInvoiceRequest> wrapper = new RequestWrapper<>();
        wrapper.setData(req);
        return wrapper;
    }

    @Test
    void test1_ExpenseOnly_Success() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.EXPENSE)
                .description("Chair")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(1000))
                .expenseAccountId(validExpenseAccountId)
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void test2_ProductOnly_Success() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.PRODUCT)
                .itemId(validProductId)
                .warehouseId(validWarehouseId)
                .locationId(validLocationId)
                .description("Logitech M185")
                .quantity(BigDecimal.TEN)
                .unitPrice(BigDecimal.valueOf(850))
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void test3_Mixed_Success() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest prodItem = ApInvoiceItemRequest.builder()
                .itemType(ItemType.PRODUCT)
                .itemId(validProductId)
                .warehouseId(validWarehouseId)
                .locationId(validLocationId)
                .description("Mouse")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(500))
                .taxAmount(BigDecimal.ZERO)
                .build();

        ApInvoiceItemRequest expItem = ApInvoiceItemRequest.builder()
                .itemType(ItemType.EXPENSE)
                .description("Delivery")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(500))
                .expenseAccountId(validExpenseAccountId)
                .taxAmount(BigDecimal.ZERO)
                .build();
        
        req.getItems().add(prodItem);
        req.getItems().add(expItem);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isCreated());
    }

    @Test
    void test4_InvalidProduct_MissingItemId() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.PRODUCT)
                .warehouseId(validWarehouseId)
                .locationId(validLocationId)
                .description("Mouse")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(500))
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("data.items[0].itemId: itemId is required for PRODUCT"));
    }

    @Test
    void test5_InvalidProduct_MissingWarehouseId() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.PRODUCT)
                .itemId(validProductId)
                .locationId(validLocationId)
                .description("Mouse")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(500))
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("data.items[0].warehouseId: warehouseId is required for PRODUCT"));
    }

    @Test
    void test6_InvalidProduct_MissingLocationId() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.PRODUCT)
                .itemId(validProductId)
                .warehouseId(validWarehouseId)
                .description("Mouse")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(500))
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("data.items[0].locationId: locationId is required for PRODUCT"));
    }

    @Test
    void test7_InvalidExpense_MissingExpenseAccountId() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.EXPENSE)
                .description("Chair")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(1000))
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("data.items[0].expenseAccountId: expenseAccountId is required for EXPENSE"));
    }

    @Test
    void test8_MissingItemType() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .description("Chair")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(1000))
                .expenseAccountId(validExpenseAccountId)
                .taxAmount(BigDecimal.ZERO)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0]").value("data.items[0].itemType: Item type is required"));
    }

    @Test
    void test9_ExpenseMustNotRequireWarehouse() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.EXPENSE)
                .description("Chair")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(1000))
                .expenseAccountId(validExpenseAccountId)
                .taxAmount(BigDecimal.ZERO)
                .warehouseId(null)
                .locationId(null)
                .itemId(null)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isCreated());
    }

    @Test
    void test10_ProductMustNotRequireExpenseAccount() throws Exception {
        ApInvoiceRequest req = buildBaseRequest();
        ApInvoiceItemRequest item = ApInvoiceItemRequest.builder()
                .itemType(ItemType.PRODUCT)
                .itemId(validProductId)
                .warehouseId(validWarehouseId)
                .locationId(validLocationId)
                .description("Mouse")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(500))
                .taxAmount(BigDecimal.ZERO)
                .expenseAccountId(null)
                .build();
        req.getItems().add(item);

        mockMvc.perform(post("/api/account/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrap(req))))
                .andExpect(status().isCreated());
    }
}
