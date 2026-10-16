package com.erp.account.modules.customer;

import com.erp.account.common.handler.GlobalExceptionHandler;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.controller.CustomerController;
import com.erp.account.modules.customer.dto.request.CustomerFilterDto;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.mapper.CustomerMapper;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.customer.service.CustomerService;
import com.erp.account.modules.customer.service.impl.CustomerServiceImpl;
import com.erp.account.modules.customer.specification.CustomerSpecification;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.CustomerLedgerHelper;
import com.erp.account.util.CustomerValidationUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class CustomerCompanyFilteringIntegrationTest {

    private final UUID companyAId = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
    private final UUID companyBId = UUID.fromString("ad270acb-9b7b-430a-82ec-21fb3b7b9cb4");
    private final UUID emptyCompanyCId = UUID.fromString("c0000000-0000-0000-0000-000000000001");

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerMapper customerMapper;

    @Mock
    private CustomerValidationUtil customerValidationUtil;

    @Mock
    private CustomerLedgerHelper customerLedgerHelper;

    @InjectMocks
    private CustomerServiceImpl customerService;

    @Mock
    private CustomerService mockCustomerServiceForController;

    private MockMvc mockMvc;

    private Customer customerA1;
    private Customer customerA2;
    private Customer customerB1;
    private Customer customerB2;

    private CustomerResponse responseA1;
    private CustomerResponse responseA2;
    private CustomerResponse responseB1;
    private CustomerResponse responseB2;

    @BeforeEach
    void setUp() {
        Company companyA = Company.builder().id(companyAId).companyName("Company Alpha").build();
        Company companyB = Company.builder().id(companyBId).companyName("Company Beta").build();

        customerA1 = Customer.builder().id(UUID.randomUUID()).company(companyA).customerCode("CUST-A-01").customerName("Alpha Client 1").build();
        customerA1.setIsDeleted(false);
        customerA2 = Customer.builder().id(UUID.randomUUID()).company(companyA).customerCode("CUST-A-02").customerName("Alpha Client 2").build();
        customerA2.setIsDeleted(false);
        customerB1 = Customer.builder().id(UUID.randomUUID()).company(companyB).customerCode("CUST-B-01").customerName("Beta Client 1").build();
        customerB1.setIsDeleted(false);
        customerB2 = Customer.builder().id(UUID.randomUUID()).company(companyB).customerCode("CUST-B-02").customerName("Beta Client 2").build();
        customerB2.setIsDeleted(false);

        responseA1 = CustomerResponse.builder().id(customerA1.getId()).customerCode("CUST-A-01").customerName("Alpha Client 1").build();
        responseA2 = CustomerResponse.builder().id(customerA2.getId()).customerCode("CUST-A-02").customerName("Alpha Client 2").build();
        responseB1 = CustomerResponse.builder().id(customerB1.getId()).customerCode("CUST-B-01").customerName("Beta Client 1").build();
        responseB2 = CustomerResponse.builder().id(customerB2.getId()).customerCode("CUST-B-02").customerName("Beta Client 2").build();

        CustomerController customerController = new CustomerController(mockCustomerServiceForController);
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    private void authenticateAsSystemAdmin() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "sysadmin", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.clearCompanyId();
    }

    private void authenticateAsTenantUser(UUID companyId) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "tenantUser", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setCompanyId(companyId);
    }

    @Test
    @DisplayName("System Admin querying Company A receives only Company A's customers")
    void testSystemAdmin_QueryCompanyA_ReturnsOnlyCompanyACustomers() {
        authenticateAsSystemAdmin();
        Pageable pageable = PageRequest.of(0, 10);
        CustomerFilterDto filter = new CustomerFilterDto();

        when(customerRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(customerA1, customerA2), pageable, 2));
        when(customerMapper.entityToResponse(customerA1)).thenReturn(responseA1);
        when(customerMapper.entityToResponse(customerA2)).thenReturn(responseA2);

        Page<CustomerResponse> page = customerService.getAllCustomers(filter, pageable, companyAId);

        assertNotNull(page);
        assertEquals(2, page.getTotalElements());
        assertEquals(1, page.getTotalPages());
        assertEquals(2, page.getContent().size());
        assertEquals("CUST-A-01", page.getContent().get(0).getCustomerCode());
        assertEquals("CUST-A-02", page.getContent().get(1).getCustomerCode());

        // Verify none of Company B's customers are in the response
        assertTrue(page.getContent().stream().noneMatch(c -> "CUST-B-01".equals(c.getCustomerCode())));
        assertTrue(page.getContent().stream().noneMatch(c -> "CUST-B-02".equals(c.getCustomerCode())));
    }

    @Test
    @DisplayName("System Admin querying Company B receives only Company B's customers")
    void testSystemAdmin_QueryCompanyB_ReturnsOnlyCompanyBCustomers() {
        authenticateAsSystemAdmin();
        Pageable pageable = PageRequest.of(0, 10);
        CustomerFilterDto filter = new CustomerFilterDto();

        when(customerRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(customerB1, customerB2), pageable, 2));
        when(customerMapper.entityToResponse(customerB1)).thenReturn(responseB1);
        when(customerMapper.entityToResponse(customerB2)).thenReturn(responseB2);

        Page<CustomerResponse> page = customerService.getAllCustomers(filter, pageable, companyBId);

        assertNotNull(page);
        assertEquals(2, page.getTotalElements());
        assertEquals(1, page.getTotalPages());
        assertEquals(2, page.getContent().size());
        assertEquals("CUST-B-01", page.getContent().get(0).getCustomerCode());
        assertEquals("CUST-B-02", page.getContent().get(1).getCustomerCode());

        // Verify none of Company A's customers are in the response
        assertTrue(page.getContent().stream().noneMatch(c -> "CUST-A-01".equals(c.getCustomerCode())));
        assertTrue(page.getContent().stream().noneMatch(c -> "CUST-A-02".equals(c.getCustomerCode())));
    }

    @Test
    @DisplayName("Querying an empty Company C returns an empty page with totalElements=0")
    void testQueryEmptyCompany_ReturnsZeroCountAndEmptyArray() {
        authenticateAsSystemAdmin();
        Pageable pageable = PageRequest.of(0, 10);
        CustomerFilterDto filter = new CustomerFilterDto();

        when(customerRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));

        Page<CustomerResponse> page = customerService.getAllCustomers(filter, pageable, emptyCompanyCId);

        assertNotNull(page);
        assertEquals(0, page.getTotalElements());
        assertEquals(0, page.getTotalPages());
        assertTrue(page.getContent().isEmpty());
    }

    @Test
    @DisplayName("Tenant user of Company A querying their own company receives Company A's customers")
    void testTenantUserCompanyA_QueryOwnCompany_Succeeds() {
        authenticateAsTenantUser(companyAId);
        Pageable pageable = PageRequest.of(0, 10);
        CustomerFilterDto filter = new CustomerFilterDto();

        when(customerRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(customerA1, customerA2), pageable, 2));
        when(customerMapper.entityToResponse(customerA1)).thenReturn(responseA1);
        when(customerMapper.entityToResponse(customerA2)).thenReturn(responseA2);

        Page<CustomerResponse> page = customerService.getAllCustomers(filter, pageable, companyAId);

        assertNotNull(page);
        assertEquals(2, page.getTotalElements());
        assertEquals(2, page.getContent().size());
    }

    @Test
    @DisplayName("Tenant user of Company A omitting companyId automatically defaults to Company A")
    void testTenantUserCompanyA_QueryWithoutCompanyId_DefaultsToOwnCompany() {
        authenticateAsTenantUser(companyAId);
        Pageable pageable = PageRequest.of(0, 10);
        CustomerFilterDto filter = new CustomerFilterDto();

        when(customerRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(customerA1, customerA2), pageable, 2));
        when(customerMapper.entityToResponse(customerA1)).thenReturn(responseA1);
        when(customerMapper.entityToResponse(customerA2)).thenReturn(responseA2);

        Page<CustomerResponse> page = customerService.getAllCustomers(filter, pageable, null);

        assertNotNull(page);
        assertEquals(2, page.getTotalElements());
        assertEquals(2, page.getContent().size());
    }

    @Test
    @DisplayName("Tenant user of Company A attempting to query Company B is rejected with AccessDeniedException (403)")
    void testTenantUserCompanyA_QueryCompanyB_ThrowsAccessDeniedException() {
        authenticateAsTenantUser(companyAId);
        Pageable pageable = PageRequest.of(0, 10);
        CustomerFilterDto filter = new CustomerFilterDto();

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                customerService.getAllCustomers(filter, pageable, companyBId)
        );

        assertTrue(ex.getMessage().contains("Access denied"));
        verifyNoInteractions(customerRepository);
    }

    @Test
    @DisplayName("Controller binds companyId request parameter and returns Company A customers")
    void testController_CompanyA_ReturnsOkWithData() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<CustomerResponse> page = new PageImpl<>(List.of(responseA1, responseA2), pageable, 2);

        when(mockCustomerServiceForController.getAllCustomers(any(CustomerFilterDto.class), any(Pageable.class), eq(companyAId)))
                .thenReturn(page);

        mockMvc.perform(get("/api/account/customers")
                        .param("page", "0")
                        .param("size", "10")
                        .param("companyId", companyAId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.pagination.totalElements").value(2))
                .andExpect(jsonPath("$.data[0].customerCode").value("CUST-A-01"))
                .andExpect(jsonPath("$.data[1].customerCode").value("CUST-A-02"));
    }

    @Test
    @DisplayName("Controller binds companyId request parameter and returns Company B customers")
    void testController_CompanyB_ReturnsOkWithData() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<CustomerResponse> page = new PageImpl<>(List.of(responseB1, responseB2), pageable, 2);

        when(mockCustomerServiceForController.getAllCustomers(any(CustomerFilterDto.class), any(Pageable.class), eq(companyBId)))
                .thenReturn(page);

        mockMvc.perform(get("/api/account/customers")
                        .param("page", "0")
                        .param("size", "10")
                        .param("companyId", companyBId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.pagination.totalElements").value(2))
                .andExpect(jsonPath("$.data[0].customerCode").value("CUST-B-01"))
                .andExpect(jsonPath("$.data[1].customerCode").value("CUST-B-02"));
    }

    @Test
    @DisplayName("Controller binds companyId for empty company and returns totalElements=0")
    void testController_EmptyCompany_ReturnsZeroElements() throws Exception {
        Pageable pageable = PageRequest.of(0, 10);
        Page<CustomerResponse> page = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(mockCustomerServiceForController.getAllCustomers(any(CustomerFilterDto.class), any(Pageable.class), eq(emptyCompanyCId)))
                .thenReturn(page);

        mockMvc.perform(get("/api/account/customers")
                        .param("page", "0")
                        .param("size", "10")
                        .param("companyId", emptyCompanyCId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.pagination.totalElements").value(0))
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    @DisplayName("Controller returns HTTP 403 Forbidden when unauthorized cross-company query is attempted")
    void testController_CrossCompanyUnauthorized_Returns403Forbidden() throws Exception {
        when(mockCustomerServiceForController.getAllCustomers(any(CustomerFilterDto.class), any(Pageable.class), eq(companyBId)))
                .thenThrow(new AccessDeniedException("Access denied: User does not have access to company " + companyBId));

        mockMvc.perform(get("/api/account/customers")
                        .param("page", "0")
                        .param("size", "10")
                        .param("companyId", companyBId.toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Forbidden"));
    }

    @Test
    @DisplayName("CustomerSpecification creates company filter and isDeleted predicates")
    @SuppressWarnings("unchecked")
    void testCustomerSpecification_BuildsCompanyPredicate() {
        CustomerFilterDto filter = new CustomerFilterDto();
        Specification<Customer> spec = CustomerSpecification.getFilterSpecification(filter, companyAId);

        Root<Customer> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> companyPath = mock(Path.class);
        Path<Object> companyIdPath = mock(Path.class);
        Path<Boolean> isDeletedPath = mock(Path.class);
        Predicate companyPredicate = mock(Predicate.class);
        Predicate isDeletedPredicate = mock(Predicate.class);
        Predicate andPredicate = mock(Predicate.class);

        when(root.get("company")).thenReturn(companyPath);
        when(companyPath.get("id")).thenReturn(companyIdPath);
        when(cb.equal(companyIdPath, companyAId)).thenReturn(companyPredicate);

        when(root.<Boolean>get("isDeleted")).thenReturn(isDeletedPath);
        when(cb.isFalse(isDeletedPath)).thenReturn(isDeletedPredicate);
        when(cb.and(any(Predicate[].class))).thenReturn(andPredicate);

        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        verify(cb).equal(companyIdPath, companyAId);
        verify(cb).isFalse(isDeletedPath);
        // Verify address join was NOT invoked since no address filter was provided
        verify(root, never()).join(eq("addresses"), any());
    }

    @Test
    @DisplayName("CustomerSpecification joins addresses when searchKey is provided")
    @SuppressWarnings("unchecked")
    void testCustomerSpecification_JoinsAddressesWhenSearchKeyProvided() {
        CustomerFilterDto filter = new CustomerFilterDto();
        filter.setSearchKey("test");
        Specification<Customer> spec = CustomerSpecification.getFilterSpecification(filter, companyAId);

        Root<Customer> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> companyPath = mock(Path.class);
        Path<Object> companyIdPath = mock(Path.class);
        Path<Boolean> isDeletedPath = mock(Path.class);
        Path<String> strPath = mock(Path.class);
        Path<Object> addrPath = mock(Path.class);
        jakarta.persistence.criteria.Join addressJoin = mock(jakarta.persistence.criteria.Join.class);

        when(root.<Boolean>get("isDeleted")).thenReturn(isDeletedPath);
        when(cb.isFalse(isDeletedPath)).thenReturn(mock(Predicate.class));

        when(root.get("company")).thenReturn(companyPath);
        when(companyPath.get("id")).thenReturn(companyIdPath);
        when(cb.equal(companyIdPath, companyAId)).thenReturn(mock(Predicate.class));

        doReturn(addressJoin).when(root).join(eq("addresses"), any());
        when(root.<String>get("customerCode")).thenReturn(strPath);
        when(root.<String>get("customerName")).thenReturn(strPath);
        when(root.<String>get("email")).thenReturn(strPath);
        when(root.<String>get("phone")).thenReturn(strPath);
        when(root.<String>get("gstin")).thenReturn(strPath);
        when(root.<String>get("panNo")).thenReturn(strPath);

        when(addressJoin.<String>get(anyString())).thenReturn(strPath);
        when(addressJoin.get("gstState")).thenReturn(addrPath);
        when(addrPath.<String>get(anyString())).thenReturn(strPath);
        when(cb.lower(any())).thenReturn(mock(jakarta.persistence.criteria.Expression.class));
        when(cb.like(any(), anyString())).thenReturn(mock(Predicate.class));
        when(cb.or(any(Predicate[].class))).thenReturn(mock(Predicate.class));
        when(cb.or(any(Predicate.class), any(Predicate.class))).thenReturn(mock(Predicate.class));
        when(cb.and(any(Predicate[].class))).thenReturn(mock(Predicate.class));

        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        // Verify address join WAS invoked
        verify(root).join(eq("addresses"), any());
        verify(query).distinct(true);
    }
}
