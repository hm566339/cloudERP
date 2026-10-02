package com.erp.account.modules.salesorder.mapper;

import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.security.CurrentUserContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SalesOrderAuditMappingTest {

    private SalesOrderMapper salesOrderMapper;
    private ObjectMapper objectMapper;

    private UUID userId;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @BeforeEach
    void setUp() {
        salesOrderMapper = new SalesOrderMapper();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        userId = UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012");
        username = "Rahul950";
        createdAt = LocalDateTime.of(2026, 9, 17, 2, 44, 58, 299639000);
        updatedAt = LocalDateTime.of(2026, 9, 17, 2, 49, 16, 560711000);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clearUserId();
        CurrentUserContext.clearUsername();
    }

    @Test
    void testToResponse_DraftSalesOrder_PopulatesAudit() {
        SalesOrder so = createSalesOrder(SalesOrderStatus.DRAFT, "SO-2026-09-000010");

        SalesOrderResponse response = salesOrderMapper.toResponse(so);

        assertNotNull(response);
        assertEquals("SO-2026-09-000010", response.getSoNumber());
        assertEquals(SalesOrderStatus.DRAFT, response.getStatus());

        // Verify audit block
        assertNotNull(response.getAudit(), "Audit block must not be null");

        // Created By & Created At
        assertNotNull(response.getAudit().getCreated());
        assertEquals(createdAt, response.getAudit().getCreated().getAt());
        assertNotNull(response.getAudit().getCreated().getBy());
        assertEquals(userId, response.getAudit().getCreated().getBy().getId());
        assertEquals(username, response.getAudit().getCreated().getBy().getUsername());

        // Updated By & Updated At
        assertNotNull(response.getAudit().getUpdated());
        assertEquals(updatedAt, response.getAudit().getUpdated().getAt());
        assertNotNull(response.getAudit().getUpdated().getBy());
        assertEquals(userId, response.getAudit().getUpdated().getBy().getId());
        assertEquals(username, response.getAudit().getUpdated().getBy().getUsername());

        // Verify backward compatibility fields
        assertEquals(createdAt, response.getCreatedAt());
        assertEquals(userId, response.getCreatedBy());
    }

    @Test
    void testToResponse_ConfirmedSalesOrder_PopulatesAudit() {
        SalesOrder so = createSalesOrder(SalesOrderStatus.CONFIRMED, "SO-2026-09-000011");

        SalesOrderResponse response = salesOrderMapper.toResponse(so);

        assertNotNull(response);
        assertEquals("SO-2026-09-000011", response.getSoNumber());
        assertEquals(SalesOrderStatus.CONFIRMED, response.getStatus());

        assertNotNull(response.getAudit());
        assertNotNull(response.getAudit().getCreated());
        assertEquals(userId, response.getAudit().getCreated().getBy().getId());
        assertEquals(username, response.getAudit().getCreated().getBy().getUsername());

        assertNotNull(response.getAudit().getUpdated());
        assertEquals(userId, response.getAudit().getUpdated().getBy().getId());
        assertEquals(username, response.getAudit().getUpdated().getBy().getUsername());
    }

    @Test
    void testToResponse_FallbackToCurrentUserContext_WhenUsernameNotSavedOnEntity() {
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername("SessionUser");

        SalesOrder so = createSalesOrder(SalesOrderStatus.DRAFT, "SO-2026-09-000012");
        so.setCreatedByUsername(null);
        so.setUpdatedByUsername(null);

        SalesOrderResponse response = salesOrderMapper.toResponse(so);

        assertNotNull(response);
        assertNotNull(response.getAudit());
        assertNotNull(response.getAudit().getCreated());
        assertEquals(userId, response.getAudit().getCreated().getBy().getId());
        assertEquals("SessionUser", response.getAudit().getCreated().getBy().getUsername());

        assertNotNull(response.getAudit().getUpdated());
        assertEquals(userId, response.getAudit().getUpdated().getBy().getId());
        assertEquals("SessionUser", response.getAudit().getUpdated().getBy().getUsername());
    }

    @Test
    void testToResponse_NullEntity_ReturnsNull() {
        assertNull(salesOrderMapper.toResponse(null));
    }

    @Test
    void testToResponse_JsonSerializationStructure() throws Exception {
        SalesOrder so = createSalesOrder(SalesOrderStatus.CONFIRMED, "SO-2026-09-000010");
        SalesOrderResponse response = salesOrderMapper.toResponse(so);

        String json = objectMapper.writeValueAsString(response);
        JsonNode root = objectMapper.readTree(json);

        assertTrue(root.has("audit"), "JSON must have 'audit' property");
        assertFalse(root.get("audit").isNull(), "'audit' must not be null");

        JsonNode auditNode = root.get("audit");
        assertTrue(auditNode.has("created"), "audit must have 'created'");
        assertTrue(auditNode.has("updated"), "audit must have 'updated'");

        JsonNode createdNode = auditNode.get("created");
        assertTrue(createdNode.has("by"));
        assertTrue(createdNode.has("at"));
        assertEquals(userId.toString(), createdNode.get("by").get("id").asText());
        assertEquals(username, createdNode.get("by").get("username").asText());

        JsonNode updatedNode = auditNode.get("updated");
        assertTrue(updatedNode.has("by"));
        assertTrue(updatedNode.has("at"));
        assertEquals(userId.toString(), updatedNode.get("by").get("id").asText());
        assertEquals(username, updatedNode.get("by").get("username").asText());
    }

    private SalesOrder createSalesOrder(SalesOrderStatus status, String soNumber) {
        Customer customer = Customer.builder()
                .id(UUID.randomUUID())
                .customerName("Acme Industries")
                .build();

        SalesOrder so = SalesOrder.builder()
                .id(UUID.randomUUID())
                .soNumber(soNumber)
                .soDate(LocalDate.of(2026, 9, 17))
                .status(status)
                .customer(customer)
                .customerId(customer.getId())
                .currency("INR")
                .totalAmount(new BigDecimal("5000.0000"))
                .sourceProformaInvoiceId(UUID.randomUUID())
                .sourceProformaInvoiceNumber("PI-2026-09-000001")
                .sourceQuotationId(UUID.randomUUID())
                .sourceQuotationNumber("QT-2026-09-000001")
                .build();

        so.setCreatedAt(createdAt);
        so.setCreatedBy(userId);
        so.setCreatedByUsername(username);
        so.setUpdatedAt(updatedAt);
        so.setUpdatedBy(userId);
        so.setUpdatedByUsername(username);

        return so;
    }
}
