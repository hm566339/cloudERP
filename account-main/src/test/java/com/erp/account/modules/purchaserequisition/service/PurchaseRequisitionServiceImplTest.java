package com.erp.account.modules.purchaserequisition.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.auth.service.UserLookupService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.purchaserequisition.dto.PurchaseRequisitionRequest;
import com.erp.account.modules.purchaserequisition.dto.PurchaseRequisitionItemRequest;
import com.erp.account.modules.purchaserequisition.dto.PurchaseRequisitionResponse;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisitionItem;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisitionStatus;
import com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
import com.erp.account.modules.purchaserequisition.service.impl.PurchaseRequisitionServiceImpl;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PurchaseRequisitionServiceImplTest {

    @Mock
    private PurchaseRequisitionRepository repository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private UserLookupService userLookupService;

    @Mock
    private com.erp.account.common.service.WarehouseLookupService warehouseLookupService;

    @InjectMocks
    private PurchaseRequisitionServiceImpl service;

    private MockedStatic<TenantUtils> mockedTenantUtils;

    private UUID companyId;
    private UUID userId;
    private UUID requisitionId;
    private Company company;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
        requisitionId = UUID.randomUUID();
        company = Company.builder().id(companyId).companyName("Test Corp").companyCode("TC").build();

        mockedTenantUtils = Mockito.mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenReturn(companyId);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyIdForQuery(any())).thenReturn(companyId);
        mockedTenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(userId);

        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        mockedTenantUtils.close();
        SecurityContextHolder.clearContext();
    }

    private void setCurrentRole(String role) {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "system", null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private PurchaseRequisition buildEntity(UUID id, UUID requesterId, PurchaseRequisitionStatus status) {
        return PurchaseRequisition.builder()
                .id(id)
                .companyId(companyId)
                .company(company)
                .requisitionNumber("PR-2026-09-000001")
                .requesterId(requesterId)
                .requiredDate(LocalDate.now().plusDays(1))
                .priority("MEDIUM")
                .purpose("Test purpose")
                .status(status)
                .items(new ArrayList<>())
                .build();
    }

    private PurchaseRequisitionItem buildItem(PurchaseRequisition pr) {
        PurchaseRequisitionItem item = PurchaseRequisitionItem.builder()
                .id(UUID.randomUUID())
                .itemId(UUID.randomUUID())
                .itemName("Test Item")
                .requestedQuantity(new BigDecimal("10"))
                .unit("PCS")
                .estimatedUnitPrice(new BigDecimal("100"))
                .estimatedAmount(new BigDecimal("1000"))
                .requiredDate(LocalDate.now().plusDays(5))
                .build();
        item.setPurchaseRequisition(pr);
        item.setCompanyId(pr.getCompanyId());
        return item;
    }

    // ────────────────────────────────────────────────────────────
    // GET: valid requesterId → requesterName returned
    // ────────────────────────────────────────────────────────────
    @Test
    void get_validRequesterId_returnsRequesterName() {
        UUID id = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, userId, PurchaseRequisitionStatus.DRAFT);
        entity.getItems().add(buildItem(entity));

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)).thenReturn(Optional.of(entity));
        when(userLookupService.resolveFullNames(Set.of(userId))).thenReturn(Map.of(userId, "John Doe"));

        PurchaseRequisitionResponse response = service.get(companyId, id);

        assertNotNull(response);
        assertEquals(userId, response.getRequesterId());
        assertEquals("John Doe", response.getRequesterName());
        verify(userLookupService).resolveFullNames(Set.of(userId));
    }

    // ────────────────────────────────────────────────────────────
    // GET: invalid requesterId (not in user store) → requesterName null
    // ────────────────────────────────────────────────────────────
    @Test
    void get_invalidRequesterId_requesterNameNull() {
        UUID id = UUID.randomUUID();
        UUID unknownUser = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, unknownUser, PurchaseRequisitionStatus.DRAFT);
        entity.getItems().add(buildItem(entity));

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)).thenReturn(Optional.of(entity));
        when(userLookupService.resolveFullNames(Set.of(unknownUser))).thenReturn(Collections.emptyMap());

        PurchaseRequisitionResponse response = service.get(companyId, id);

        assertNotNull(response);
        assertEquals(unknownUser, response.getRequesterId());
        assertNull(response.getRequesterName());
    }

    // ────────────────────────────────────────────────────────────
    // GET: null requesterId → requesterName null
    // ────────────────────────────────────────────────────────────
    @Test
    void get_nullRequesterId_requesterNameNull() {
        UUID id = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, null, PurchaseRequisitionStatus.DRAFT);
        entity.getItems().add(buildItem(entity));

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)).thenReturn(Optional.of(entity));

        PurchaseRequisitionResponse response = service.get(companyId, id);

        assertNotNull(response);
        assertNull(response.getRequesterId());
        assertNull(response.getRequesterName());
        verify(userLookupService, never()).resolveFullNames(any());
    }

    // ────────────────────────────────────────────────────────────
    // LIST: multiple requisitions → single batch lookup (no N+1)
    // ────────────────────────────────────────────────────────────
    @Test
    void list_multipleRequisitions_singleBatchLookup() {
        UUID userA = UUID.randomUUID();
        UUID userB = UUID.randomUUID();

        PurchaseRequisition pr1 = buildEntity(UUID.randomUUID(), userA, PurchaseRequisitionStatus.DRAFT);
        pr1.getItems().add(buildItem(pr1));
        PurchaseRequisition pr2 = buildEntity(UUID.randomUUID(), userB, PurchaseRequisitionStatus.SUBMITTED);
        pr2.getItems().add(buildItem(pr2));
        PurchaseRequisition pr3 = buildEntity(UUID.randomUUID(), userA, PurchaseRequisitionStatus.APPROVED);
        pr3.getItems().add(buildItem(pr3));

        Page<PurchaseRequisition> page = new PageImpl<>(List.of(pr1, pr2, pr3), PageRequest.of(0, 10), 3);
        when(repository.findByCompanyIdAndIsDeletedFalse(eq(companyId), any(Pageable.class))).thenReturn(page);
        when(userLookupService.resolveFullNames(Set.of(userA, userB)))
                .thenReturn(Map.of(userA, "Alice", userB, "Bob"));

        Page<PurchaseRequisitionResponse> result = service.list(companyId, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(3, result.getContent().size());

        PurchaseRequisitionResponse r1 = result.getContent().get(0);
        assertEquals(userA, r1.getRequesterId());
        assertEquals("Alice", r1.getRequesterName());

        PurchaseRequisitionResponse r2 = result.getContent().get(1);
        assertEquals(userB, r2.getRequesterId());
        assertEquals("Bob", r2.getRequesterName());

        PurchaseRequisitionResponse r3 = result.getContent().get(2);
        assertEquals(userA, r3.getRequesterId());
        assertEquals("Alice", r3.getRequesterName());

        verify(userLookupService, times(1)).resolveFullNames(Set.of(userA, userB));
    }

    // ────────────────────────────────────────────────────────────
    // LIST: null requesterIds filtered out
    // ────────────────────────────────────────────────────────────
    @Test
    void list_nullRequesterIds_filteredOut() {
        UUID userA = UUID.randomUUID();

        PurchaseRequisition pr1 = buildEntity(UUID.randomUUID(), userA, PurchaseRequisitionStatus.DRAFT);
        pr1.getItems().add(buildItem(pr1));
        PurchaseRequisition pr2 = buildEntity(UUID.randomUUID(), null, PurchaseRequisitionStatus.SUBMITTED);
        pr2.getItems().add(buildItem(pr2));

        Page<PurchaseRequisition> page = new PageImpl<>(List.of(pr1, pr2), PageRequest.of(0, 10), 2);
        when(repository.findByCompanyIdAndIsDeletedFalse(eq(companyId), any(Pageable.class))).thenReturn(page);
        when(userLookupService.resolveFullNames(Set.of(userA))).thenReturn(Map.of(userA, "Alice"));

        Page<PurchaseRequisitionResponse> result = service.list(companyId, PageRequest.of(0, 10));

        assertEquals(2, result.getContent().size());
        assertEquals("Alice", result.getContent().get(0).getRequesterName());
        assertNull(result.getContent().get(1).getRequesterName());
        verify(userLookupService).resolveFullNames(Set.of(userA));
    }

    // ────────────────────────────────────────────────────────────
    // LIST: empty page → no lookup call
    // ────────────────────────────────────────────────────────────
    @Test
    void list_emptyPage_noLookupCall() {
        Page<PurchaseRequisition> page = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(repository.findByCompanyIdAndIsDeletedFalse(eq(companyId), any(Pageable.class))).thenReturn(page);

        Page<PurchaseRequisitionResponse> result = service.list(companyId, PageRequest.of(0, 10));

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        verify(userLookupService).resolveFullNames(Collections.emptySet());
    }

    // ────────────────────────────────────────────────────────────
    // LIST: userLookupService fails → requesterName null, API doesn't fail
    // ────────────────────────────────────────────────────────────
    @Test
    void list_userLookupFails_requesterNameNull() {
        UUID userA = UUID.randomUUID();
        PurchaseRequisition pr1 = buildEntity(UUID.randomUUID(), userA, PurchaseRequisitionStatus.DRAFT);
        pr1.getItems().add(buildItem(pr1));

        Page<PurchaseRequisition> page = new PageImpl<>(List.of(pr1), PageRequest.of(0, 10), 1);
        when(repository.findByCompanyIdAndIsDeletedFalse(eq(companyId), any(Pageable.class))).thenReturn(page);
        when(userLookupService.resolveFullNames(Set.of(userA))).thenReturn(Collections.emptyMap());

        Page<PurchaseRequisitionResponse> result = service.list(companyId, PageRequest.of(0, 10));

        assertEquals(1, result.getContent().size());
        assertEquals(userA, result.getContent().get(0).getRequesterId());
        assertNull(result.getContent().get(0).getRequesterName());
    }

    // ────────────────────────────────────────────────────────────
    // CREATE: requesterName returned in response
    // ────────────────────────────────────────────────────────────
    @Test
    void create_validRequest_returnsRequesterName() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(voucherSequenceService.generateNextPurchaseRequisitionNumber(eq(companyId), any())).thenReturn("PR-2026-09-000001");
        when(repository.save(any(PurchaseRequisition.class))).thenAnswer(inv -> {
            PurchaseRequisition pr = inv.getArgument(0);
            pr.setId(UUID.randomUUID());
            pr.setItems(new ArrayList<>());
            return pr;
        });
        when(userLookupService.resolveFullNames(Set.of(userId))).thenReturn(Map.of(userId, "John Doe"));

        PurchaseRequisitionRequest request = PurchaseRequisitionRequest.builder()
                .requesterId(userId)
                .requiredDate(LocalDate.now().plusDays(1))
                .priority("MEDIUM")
                .purpose("Test purpose")
                .items(List.of(PurchaseRequisitionItemRequest.builder()
                        .itemId(UUID.randomUUID())
                        .itemName("Test Item")
                        .requestedQuantity(new BigDecimal("5"))
                        .unit("PCS")
                        .estimatedUnitPrice(new BigDecimal("100"))
                        .build()))
                .build();

        PurchaseRequisitionResponse response = service.create(companyId, request);

        assertNotNull(response);
        assertEquals(userId, response.getRequesterId());
        assertEquals("John Doe", response.getRequesterName());
    }

    // ────────────────────────────────────────────────────────────
    // Pagination preserved
    // ────────────────────────────────────────────────────────────
    @Test
    void list_paginationPreserved() {
        UUID userA = UUID.randomUUID();
        PurchaseRequisition pr = buildEntity(UUID.randomUUID(), userA, PurchaseRequisitionStatus.DRAFT);
        pr.getItems().add(buildItem(pr));

        PageRequest pageRequest = PageRequest.of(2, 5);
        Page<PurchaseRequisition> page = new PageImpl<>(List.of(pr), pageRequest, 15);
        when(repository.findByCompanyIdAndIsDeletedFalse(eq(companyId), any(Pageable.class))).thenReturn(page);
        when(userLookupService.resolveFullNames(Set.of(userA))).thenReturn(Map.of(userA, "Alice"));

        Page<PurchaseRequisitionResponse> result = service.list(companyId, pageRequest);

        assertEquals(2, result.getNumber());
        assertEquals(5, result.getSize());
        assertEquals(15, result.getTotalElements());
        assertEquals(3, result.getTotalPages());
    }

    // ────────────────────────────────────────────────────────────
    // SUBMIT: existing fields unchanged
    // ────────────────────────────────────────────────────────────
    @Test
    void submit_existingFieldsUnchanged() {
        UUID id = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, userId, PurchaseRequisitionStatus.DRAFT);
        entity.getItems().add(buildItem(entity));

        when(repository.findForUpdate(id, companyId)).thenReturn(Optional.of(entity));
        when(repository.save(any(PurchaseRequisition.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userLookupService.resolveFullNames(Set.of(userId))).thenReturn(Map.of(userId, "John Doe"));

        PurchaseRequisitionResponse response = service.submit(companyId, id);

        assertEquals(PurchaseRequisitionStatus.SUBMITTED, response.getStatus());
        assertEquals(userId, response.getSubmittedBy());
        assertNotNull(response.getSubmittedAt());
        assertEquals("John Doe", response.getRequesterName());
        assertEquals(id, response.getId());
        assertEquals("PR-2026-09-000001", response.getRequisitionNumber());
    }

    // ────────────────────────────────────────────────────────────
    // GET: requisition not found → exception
    // ────────────────────────────────────────────────────────────
    @Test
    void get_requisitionNotFound_throwsException() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.get(companyId, id));
    }

    // ────────────────────────────────────────────────────────────
    // APPROVE: Requester (normal user) cannot approve own requisition
    // ────────────────────────────────────────────────────────────
    @Test
    void approve_requesterNormalUserSelfApproval_rejected() {
        UUID id = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, userId, PurchaseRequisitionStatus.SUBMITTED);
        entity.getItems().add(buildItem(entity));

        when(repository.findForUpdate(id, companyId)).thenReturn(Optional.of(entity));

        setCurrentRole("BUYER");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.approve(companyId, id));
        assertEquals("Requester cannot approve their own requisition", ex.getMessage());
        verify(repository, never()).save(any());
    }

    // ────────────────────────────────────────────────────────────
    // APPROVE: FINANCE_MANAGER may approve own requisition
    // ────────────────────────────────────────────────────────────
    @Test
    void approve_requesterFinanceManagerSelfApproval_allowed() {
        approveSelfWithRoleAllows("FINANCE_MANAGER");
    }

    // ────────────────────────────────────────────────────────────
    // APPROVE: SYSTEM_ADMIN may approve own requisition
    // ────────────────────────────────────────────────────────────
    @Test
    void approve_requesterSystemAdminSelfApproval_allowed() {
        approveSelfWithRoleAllows("SYSTEM_ADMIN");
    }

    // ────────────────────────────────────────────────────────────
    // APPROVE: CFO may approve own requisition
    // ────────────────────────────────────────────────────────────
    @Test
    void approve_requesterCfoSelfApproval_allowed() {
        approveSelfWithRoleAllows("CFO");
    }

    // ────────────────────────────────────────────────────────────
    // APPROVE: different requester approves (existing behavior)
    // ────────────────────────────────────────────────────────────
    @Test
    void approve_differentRequester_notPrivileged_allowed() {
        UUID id = UUID.randomUUID();
        UUID anotherUser = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, anotherUser, PurchaseRequisitionStatus.SUBMITTED);
        entity.getItems().add(buildItem(entity));

        when(repository.findForUpdate(id, companyId)).thenReturn(Optional.of(entity));
        when(repository.save(any(PurchaseRequisition.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userLookupService.resolveFullNames(Set.of(anotherUser))).thenReturn(Map.of(anotherUser, "Another User"));

        setCurrentRole("BUYER");

        PurchaseRequisitionResponse response = service.approve(companyId, id);

        assertEquals(PurchaseRequisitionStatus.APPROVED, response.getStatus());
        assertEquals(userId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    // ────────────────────────────────────────────────────────────
    // APPROVE: role exception must NOT bypass workflow status check
    // ────────────────────────────────────────────────────────────
    @Test
    void approve_cfoSelfApproval_nonSubmitted_stillRejected() {
        UUID id = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, userId, PurchaseRequisitionStatus.DRAFT);
        entity.getItems().add(buildItem(entity));

        when(repository.findForUpdate(id, companyId)).thenReturn(Optional.of(entity));

        setCurrentRole("CFO");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> service.approve(companyId, id));
        assertEquals("Only SUBMITTED requisitions can be approved", ex.getMessage());
    }

    private void approveSelfWithRoleAllows(String role) {
        UUID id = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, userId, PurchaseRequisitionStatus.SUBMITTED);
        entity.getItems().add(buildItem(entity));

        when(repository.findForUpdate(id, companyId)).thenReturn(Optional.of(entity));
        when(repository.save(any(PurchaseRequisition.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userLookupService.resolveFullNames(Set.of(userId))).thenReturn(Map.of(userId, "John Doe"));

        setCurrentRole(role);

        PurchaseRequisitionResponse response = service.approve(companyId, id);

        assertEquals(PurchaseRequisitionStatus.APPROVED, response.getStatus());
        assertEquals(userId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    @Test
    void get_withWarehouseAndLocation_returnsNamesInResponse() {
        UUID id = UUID.randomUUID();
        UUID whId = UUID.randomUUID();
        UUID locId = UUID.randomUUID();
        PurchaseRequisition entity = buildEntity(id, userId, PurchaseRequisitionStatus.DRAFT);
        PurchaseRequisitionItem item = buildItem(entity);
        item.setWarehouseId(whId);
        item.setLocationId(locId);
        entity.getItems().add(item);

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)).thenReturn(Optional.of(entity));
        when(userLookupService.resolveFullNames(Set.of(userId))).thenReturn(Map.of(userId, "John Doe"));
        when(warehouseLookupService.resolveAll(Set.of(new com.erp.account.common.dto.WarehouseLocationKey(whId, locId))))
                .thenReturn(Map.of(new com.erp.account.common.dto.WarehouseLocationKey(whId, locId),
                        new com.erp.account.common.dto.WarehouseLocationNameDto("Main Warehouse", "Main Storage Location")));

        PurchaseRequisitionResponse response = service.get(companyId, id);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        PurchaseRequisitionResponse.Item itemResp = response.getItems().get(0);
        assertEquals(whId, itemResp.getWarehouseId());
        assertEquals("Main Warehouse", itemResp.getWarehouseName());
        assertEquals(locId, itemResp.getLocationId());
        assertEquals("Main Storage Location", itemResp.getLocationName());
    }
}
