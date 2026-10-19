package com.erp.manufacturing.security;

import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.entity.BomRevision;
import com.erp.manufacturing.bom.repository.BomRepository;
import com.erp.manufacturing.bom.repository.BomRevisionRepository;
import com.erp.manufacturing.common.enums.BomRevisionStatus;
import com.erp.manufacturing.common.enums.BomStatus;
import com.erp.manufacturing.common.enums.BomType;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.security.sso.SsoService;
import com.erp.manufacturing.util.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class ManufacturingSecurityAndTenantIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private BomRepository bomRepository;

    @Autowired
    private BomRevisionRepository bomRevisionRepository;

    @Autowired
    private ProductionOrderRepository productionOrderRepository;

    @MockitoBean
    private SsoService ssoService;

    private UUID tenantA;
    private UUID tenantB;
    private UUID userA;
    private UUID userB;
    private UUID adminUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        tenantA = UUID.randomUUID();
        tenantB = UUID.randomUUID();
        userA = UUID.randomUUID();
        userB = UUID.randomUUID();
        adminUser = UUID.randomUUID();

        // Default: SsoService returns null (triggers local JWT fallback with exact claims)
        when(ssoService.verifyToken(anyString())).thenReturn(null);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        RequestCompanyContext.clear();
    }

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/manufacturing/production-orders"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unauthorized"));

        assertNull(CurrentUserContext.getUserId());
        assertNull(CurrentUserContext.getCompanyId());
    }

    @Test
    void missingManufacturingFeatureReturns403() throws Exception {
        String token = jwtTokenProvider.generateToken(
                userA, tenantA, "USER",
                List.of("INVENTORY"), // Missing MANUFACTURING
                List.of("INVENTORY:READ")
        );

        mockMvc.perform(get("/api/manufacturing/production-orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        assertNull(CurrentUserContext.getUserId());
        assertNull(CurrentUserContext.getCompanyId());
    }

    @Test
    void activeManufacturingFeatureAndReadActionReturns200() throws Exception {
        String token = jwtTokenProvider.generateToken(
                userA, tenantA, "USER",
                List.of("MANUFACTURING"),
                List.of("MANUFACTURING:READ")
        );

        mockMvc.perform(get("/api/manufacturing/production-orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertNull(CurrentUserContext.getUserId());
        assertNull(CurrentUserContext.getCompanyId());
    }

    @Test
    void postWithoutCreateActionReturns403() throws Exception {
        String token = jwtTokenProvider.generateToken(
                userA, tenantA, "USER",
                List.of("MANUFACTURING"),
                List.of("MANUFACTURING:READ") // Lacks CREATE action
        );

        mockMvc.perform(post("/api/manufacturing/production-orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        assertNull(CurrentUserContext.getUserId());
    }

    @Test
    void tenantIsolationTenantACannotReadTenantBOrder() throws Exception {
        // Create order belonging to Tenant B
        LocalDateTime now = LocalDateTime.now();
        Bom bomB = Bom.builder()
                .companyId(tenantB)
                .bomNumber("BOM-B-01")
                .name("Tenant B BOM")
                .finishedProductId(UUID.randomUUID())
                .bomType(BomType.STANDARD)
                .status(BomStatus.ACTIVE)
                .isDefault(true)
                .currentRevision(1)
                .build();
        bomB.setCreatedAt(now);
        bomB.setUpdatedAt(now);
        bomB.setIsDeleted(false);
        bomB.setVersion(0L);
        bomB = bomRepository.save(bomB);

        BomRevision revB = BomRevision.builder()
                .companyId(tenantB)
                .bom(bomB)
                .revisionNumber(1)
                .status(BomRevisionStatus.ACTIVE)
                .build();
        revB.setCreatedAt(now);
        revB.setUpdatedAt(now);
        revB.setIsDeleted(false);
        revB.setVersion(0L);
        revB = bomRevisionRepository.save(revB);

        ProductionOrder orderB = ProductionOrder.builder()
                .companyId(tenantB)
                .productionOrderNo("PO-TENANT-B-01")
                .finishedProductId(bomB.getFinishedProductId())
                .bom(bomB)
                .bomRevision(revB)
                .warehouseId(UUID.randomUUID())
                .plannedQuantity(new BigDecimal("50.00"))
                .producedQuantity(BigDecimal.ZERO)
                .rejectedQuantity(BigDecimal.ZERO)
                .scrapQuantity(BigDecimal.ZERO)
                .remainingQuantity(new BigDecimal("50.00"))
                .status(ProductionOrderStatus.DRAFT)
                .priority("HIGH")
                .build();
        orderB.setCreatedAt(now);
        orderB.setUpdatedAt(now);
        orderB.setIsDeleted(false);
        orderB.setVersion(0L);
        orderB = productionOrderRepository.save(orderB);

        // Tenant A tries to read Tenant B's order
        String tokenA = jwtTokenProvider.generateToken(
                userA, tenantA, "USER",
                List.of("MANUFACTURING"),
                List.of("MANUFACTURING:READ")
        );

        mockMvc.perform(get("/api/manufacturing/production-orders/" + orderB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound()); // Tenant A cannot find Tenant B's order
    }

    @Test
    void tenantIsolationTenantACannotReadTenantBBom() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        Bom bomB = Bom.builder()
                .companyId(tenantB)
                .bomNumber("BOM-B-PRIVATE")
                .name("Tenant B Private BOM")
                .finishedProductId(UUID.randomUUID())
                .bomType(BomType.STANDARD)
                .status(BomStatus.ACTIVE)
                .isDefault(true)
                .currentRevision(1)
                .build();
        bomB.setCreatedAt(now);
        bomB.setUpdatedAt(now);
        bomB.setIsDeleted(false);
        bomB.setVersion(0L);
        bomB = bomRepository.save(bomB);

        String tokenA = jwtTokenProvider.generateToken(
                userA, tenantA, "USER",
                List.of("MANUFACTURING"),
                List.of("MANUFACTURING:READ")
        );

        mockMvc.perform(get("/api/manufacturing/boms/" + bomB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    void systemAdminBypassesFeatureAndSelectsCompany() throws Exception {
        String adminToken = jwtTokenProvider.generateToken(
                adminUser, null, "SYSTEM_ADMIN",
                List.of(), // Even with no explicit feature assigned in token, SYSTEM_ADMIN bypasses FBAC
                List.of()
        );

        mockMvc.perform(get("/api/manufacturing/production-orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("X-Company-Id", tenantA.toString()))
                .andExpect(status().isOk());

        assertNull(CurrentUserContext.getUserId());
        assertNull(CurrentUserContext.getCompanyId());
        assertNull(RequestCompanyContext.getCompanyId());
    }
}
