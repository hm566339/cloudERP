package com.erp.account.modules.salesorder.service;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.response.ProductDetailResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import com.erp.account.modules.customer.repository.CustomerAddressRepository;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderProfileResponse;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
import com.erp.account.modules.settings.entity.PaymentTerm;
import com.erp.account.modules.settings.entity.TermsCondition;
import com.erp.account.modules.settings.repository.PaymentTermRepository;
import com.erp.account.modules.settings.repository.TermsConditionRepository;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SalesOrderServiceGetByIdTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerAddressRepository customerAddressRepository;

    @Mock
    private GstStateCodeRepository gstStateCodeRepository;

    @Mock
    private PaymentTermRepository paymentTermRepository;

    @Mock
    private TermsConditionRepository termsConditionRepository;

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private SalesOrderMapper salesOrderMapper;

    @InjectMocks
    private SalesOrderServiceImpl salesOrderService;

    private UUID companyId;
    private UUID salesOrderId;
    private UUID customerId;
    private UUID billingAddressId;
    private UUID deliveryAddressId;
    private UUID productId;
    private UUID hsnSacId;
    private SalesOrder salesOrder;
    private Customer customer;
    private CustomerAddress billingAddress;
    private CustomerAddress deliveryAddress;
    private SalesOrderItem item;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        salesOrderId = UUID.randomUUID();
        customerId = UUID.randomUUID();
        billingAddressId = UUID.randomUUID();
        deliveryAddressId = UUID.randomUUID();
        productId = UUID.randomUUID();
        hsnSacId = UUID.randomUUID();

        GstStateCode biharState = GstStateCode.builder()
                .stateName("BIHAR")
                .stateCode("10")
                .build();

        billingAddress = CustomerAddress.builder()
                .id(billingAddressId)
                .addressType("BILLING")
                .addressLine1("Billing St 1")
                .city("Patna")
                .gstState(biharState)
                .country("India")
                .postalCode("800001")
                .build();

        deliveryAddress = CustomerAddress.builder()
                .id(deliveryAddressId)
                .addressType("DELIVERY")
                .addressLine1("Delivery St 2")
                .city("Patna")
                .gstState(biharState)
                .country("India")
                .postalCode("800002")
                .build();

        customer = Customer.builder()
                .id(customerId)
                .customerName("Acme Corp")
                .customerCode("CUST-100")
                .email("info@acme.com")
                .phone("9876543210")
                .build();

        HsnSacMaster hsn = HsnSacMaster.builder()
                .id(hsnSacId)
                .code("84185000")
                .description("Freezer")
                .build();

        item = SalesOrderItem.builder()
                .id(UUID.randomUUID())
                .itemId(productId)
                .itemName("Deep Freezer 300L")
                .description("Commercial Deep Freezer")
                .hsnSacMaster(hsn)
                .quantity(new BigDecimal("2.0000"))
                .unit("Pieces")
                .unitPrice(new BigDecimal("20000.0000"))
                .discountPercent(new BigDecimal("10.00"))
                .discountAmount(new BigDecimal("4000.0000"))
                .taxableAmount(new BigDecimal("36000.0000"))
                .igstRate(new BigDecimal("18.00"))
                .igstAmount(new BigDecimal("6480.0000"))
                .taxAmount(new BigDecimal("6480.0000"))
                .totalAmount(new BigDecimal("42480.0000"))
                .build();

        salesOrder = SalesOrder.builder()
                .id(salesOrderId)
                .companyId(companyId)
                .soNumber("SO-2026-09-000001")
                .soDate(LocalDate.of(2026, 9, 3))
                .status(SalesOrderStatus.CONFIRMED)
                .currency("INR")
                .customer(customer)
                .customerId(customerId)
                .billingAddressId(billingAddressId)
                .deliveryAddressId(deliveryAddressId)
                .billingAddressSnapshot("Billing Snapshot Text")
                .deliveryAddressSnapshot("Delivery Snapshot Text")
                .bankDetailsSnapshot("Bank Details Text")
                .items(List.of(item))
                .subtotal(new BigDecimal("36000.0000"))
                .discountAmount(new BigDecimal("4000.0000"))
                .taxAmount(new BigDecimal("6480.0000"))
                .freightCharges(new BigDecimal("500.0000"))
                .otherCharges(new BigDecimal("200.0000"))
                .roundOff(new BigDecimal("0.0000"))
                .totalAmount(new BigDecimal("43180.0000"))
                .paymentTerms("Net 30")
                .deliveryTerms("FOB Destination")
                .notes("Handle with care")
                .termsAndConditions("Standard Terms Apply")
                .sourceQuotationNumber("QT-100")
                .sourceProformaInvoiceNumber("PI-100")
                .build();

        salesOrder.setCreatedAt(LocalDateTime.of(2026, 9, 3, 10, 0, 0));
        salesOrder.setCreatedBy(UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012"));
        salesOrder.setCreatedByUsername("Rahul950");
        salesOrder.setUpdatedAt(LocalDateTime.of(2026, 9, 3, 11, 30, 0));
        salesOrder.setUpdatedBy(UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012"));
        salesOrder.setUpdatedByUsername("Rahul950");

        item.setCreatedAt(LocalDateTime.of(2026, 9, 3, 10, 0, 0));
        item.setCreatedBy(UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012"));
        item.setCreatedByUsername("Rahul950");
    }

    @Test
    void testGetSalesOrderById_Success_CompleteData() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(salesOrderRepository.findWithItemsAndCustomerByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, companyId))
                    .thenReturn(Optional.of(salesOrder));
            when(customerAddressRepository.findById(billingAddressId)).thenReturn(Optional.of(billingAddress));
            when(customerAddressRepository.findById(deliveryAddressId)).thenReturn(Optional.of(deliveryAddress));

            // Mock inventory client response
            ProductDetailResponse prodDetail = ProductDetailResponse.builder()
                    .product(ProductDetailResponse.ProductInfo.builder()
                            .productCode("PROD-DF300")
                            .build())
                    .build();
            when(inventoryClient.getById(eq(productId), eq(companyId)))
                    .thenReturn(ResponseEntity.ok(ApiResponse.success(prodDetail, "Success")));

            SalesOrderProfileResponse response = salesOrderService.getSalesOrderById(companyId, salesOrderId);

            assertNotNull(response);
            assertEquals(salesOrderId, response.getId());
            assertEquals("SO-2026-09-000001", response.getSoNumber());
            assertEquals(LocalDate.of(2026, 9, 3), response.getSoDate());
            assertEquals("CONFIRMED", response.getStatus());
            assertEquals("INR", response.getCurrency());

            // Verify Customer & Addresses
            assertNotNull(response.getCustomer());
            assertEquals("Acme Corp", response.getCustomer().getName());
            assertEquals("CUST-100", response.getCustomer().getCode());
            assertEquals("info@acme.com", response.getCustomer().getEmail());
            assertEquals("9876543210", response.getCustomer().getPhone());

            assertNotNull(response.getCustomer().getBillingAddress());
            assertEquals("Billing St 1", response.getCustomer().getBillingAddress().getAddressLine1());
            assertEquals("Patna", response.getCustomer().getBillingAddress().getCity());
            assertEquals("BIHAR", response.getCustomer().getBillingAddress().getState());
            assertEquals("10", response.getCustomer().getBillingAddress().getStateCode());
            assertEquals("800001", response.getCustomer().getBillingAddress().getPostalCode());

            assertNotNull(response.getCustomer().getDeliveryAddress());
            assertEquals("Delivery St 2", response.getCustomer().getDeliveryAddress().getAddressLine1());
            assertEquals("800002", response.getCustomer().getDeliveryAddress().getPostalCode());

            // Verify Snapshots
            assertEquals("Billing Snapshot Text", response.getBillingAddressSnapshot());
            assertEquals("Delivery Snapshot Text", response.getDeliveryAddressSnapshot());
            assertEquals("Bank Details Text", response.getBankDetailsSnapshot());

            // Verify Items
            assertNotNull(response.getItems());
            assertEquals(1, response.getItems().size());
            var resItem = response.getItems().get(0);
            assertEquals(productId, resItem.getProductId());
            assertEquals("PROD-DF300", resItem.getProductCode());
            assertEquals("Deep Freezer 300L", resItem.getProductName());
            assertEquals("Commercial Deep Freezer", resItem.getDescription());
            assertEquals("84185000", resItem.getHsnSac());
            assertEquals(new BigDecimal("2.0000"), resItem.getQuantity());
            assertEquals("Pieces", resItem.getUnit());
            assertEquals(new BigDecimal("20000.0000"), resItem.getUnitPrice());
            assertEquals(new BigDecimal("10.00"), resItem.getDiscountPercent());
            assertEquals(new BigDecimal("4000.0000"), resItem.getDiscountAmount());
            assertEquals(new BigDecimal("18.00"), resItem.getTaxPercent());
            assertEquals(new BigDecimal("6480.0000"), resItem.getTaxAmount());
            assertEquals(new BigDecimal("18.00"), resItem.getIgstPercent());
            assertEquals(new BigDecimal("6480.0000"), resItem.getIgstAmount());
            assertEquals(new BigDecimal("36000.0000"), resItem.getSubtotal());
            assertEquals(new BigDecimal("42480.0000"), resItem.getTotalAmount());

            // Verify Totals
            assertEquals(new BigDecimal("36000.0000"), response.getSubtotal());
            assertEquals(new BigDecimal("4000.0000"), response.getDiscountAmount());
            assertEquals(new BigDecimal("6480.0000"), response.getTaxAmount());
            assertEquals(new BigDecimal("500.0000"), response.getFreightCharges());
            assertEquals(new BigDecimal("200.0000"), response.getOtherCharges());
            assertEquals(new BigDecimal("0.0000"), response.getRoundOff());
            assertEquals(new BigDecimal("43180.0000"), response.getTotalAmount());

            // Verify Commercial Terms
            assertEquals("Net 30", response.getPaymentTerms());
            assertEquals("FOB Destination", response.getDeliveryTerms());
            assertEquals("Handle with care", response.getNotes());
            assertEquals("Standard Terms Apply", response.getTermsAndConditions());
            assertEquals("QT-100", response.getSourceQuotationNumber());
            assertEquals("PI-100", response.getSourceProformaInvoiceNumber());

            // Verify Audit details
            assertNotNull(response.getAudit());
            assertNotNull(response.getAudit().getCreated());
            assertEquals(UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012"), response.getAudit().getCreated().getBy().getId());
            assertEquals("Rahul950", response.getAudit().getCreated().getBy().getUsername());
            assertEquals(LocalDateTime.of(2026, 9, 3, 10, 0, 0), response.getAudit().getCreated().getAt());

            assertNotNull(response.getAudit().getUpdated());
            assertEquals(UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012"), response.getAudit().getUpdated().getBy().getId());
            assertEquals("Rahul950", response.getAudit().getUpdated().getBy().getUsername());
            assertEquals(LocalDateTime.of(2026, 9, 3, 11, 30, 0), response.getAudit().getUpdated().getAt());

            assertNotNull(resItem.getAudit());
            assertNotNull(resItem.getAudit().getCreated());
            assertEquals(UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012"), resItem.getAudit().getCreated().getBy().getId());
            assertEquals("Rahul950", resItem.getAudit().getCreated().getBy().getUsername());
            assertEquals(LocalDateTime.of(2026, 9, 3, 10, 0, 0), resItem.getAudit().getCreated().getAt());
        }
    }

    @Test
    void testGetSalesOrderById_NotFound_Throws404() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(salesOrderRepository.findWithItemsAndCustomerByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, companyId))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> {
                salesOrderService.getSalesOrderById(companyId, salesOrderId);
            });
        }
    }

    @Test
    void testGetSalesOrderById_CompanyMismatch_Throws404() {
        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            UUID differentCompanyId = UUID.randomUUID();
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(differentCompanyId)).thenReturn(differentCompanyId);

            // Returns empty for different company
            when(salesOrderRepository.findWithItemsAndCustomerByIdAndCompanyIdAndIsDeletedFalse(salesOrderId, differentCompanyId))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> {
                salesOrderService.getSalesOrderById(differentCompanyId, salesOrderId);
            });
        }
    }

    @Test
    void testGetSalesOrderById_NullId_ThrowsValidationException() {
        assertThrows(ValidationException.class, () -> {
            salesOrderService.getSalesOrderById(companyId, null);
        });
    }
}
