package com.erp.inventory.modules.stock;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.common.dto.response.PaginationResponse;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.stock.controller.StockMovementController;
import com.erp.inventory.modules.stock.dto.request.StockMovementFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementResponse;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.mapper.StockMovementMapper;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.repository.StockMovementSpecification;
import com.erp.inventory.modules.stock.service.serviceImpl.StockMovementServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockMovementFilterAndPaginationTest {

    @Mock
    private StockMovementRepository repository;

    @Mock
    private StockMovementMapper mapper;

    @InjectMocks
    private StockMovementServiceImpl service;

    private StockMovementController controller;

    private MockedStatic<TenantUtils> mockedTenantUtils;
    private final UUID companyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        controller = new StockMovementController(service);
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(invocation -> {
            UUID arg = invocation.getArgument(0);
            return arg != null ? arg : companyId;
        });
    }

    @AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    @DisplayName("Should correctly bind prefixed parameters: filter.status=POSTED, pageable.page=0, pageable.size=10, pageable.sort=createdAt,desc")
    void testPrefixedParametersBinding() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addParameter("filter.status", "POSTED");
        request.addParameter("pageable.page", "0");
        request.addParameter("pageable.size", "10");
        request.addParameter("pageable.sort", "createdAt,desc");
        request.addParameter("companyId", companyId.toString());

        StockMovement entity = new StockMovement();
        entity.setId(UUID.randomUUID());
        entity.setStatus("POSTED");

        StockMovementResponse responseItem = new StockMovementResponse();
        responseItem.setId(entity.getId());
        responseItem.setStatus("POSTED");

        Page<StockMovement> pageResult = new PageImpl<>(List.of(entity), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")), 1);
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageResult);
        when(mapper.toResponse(entity)).thenReturn(responseItem);

        StockMovementFilterRequest filterRequest = new StockMovementFilterRequest();
        Pageable initialPageable = Pageable.unpaged();

        ResponseEntity<ApiResponse<List<StockMovementResponse>>> result = controller.getAll(filterRequest, initialPageable, companyId, request);

        assertNotNull(result.getBody());
        ApiResponse<List<StockMovementResponse>> apiResponse = result.getBody();
        assertTrue(apiResponse.isSuccess());
        assertEquals(1, apiResponse.getData().size());
        assertEquals("POSTED", apiResponse.getData().get(0).getStatus());

        // Verify pagination metadata
        PaginationResponse pagination = apiResponse.getPagination();
        assertNotNull(pagination);
        assertEquals(0, pagination.getPage(), "Page index should be 0 when page 0 requested");
        assertEquals(10, pagination.getSize(), "Page size should be 10 when size 10 requested");
        assertEquals(1, pagination.getTotalElements());
        assertEquals(1, pagination.getTotalPages());
        assertFalse(pagination.isHasNext());
        assertFalse(pagination.isHasPrevious());

        // Verify service received the resolved pageable with Sort
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable passedPageable = pageableCaptor.getValue();
        assertEquals(0, passedPageable.getPageNumber());
        assertEquals(10, passedPageable.getPageSize());
        Sort.Order order = passedPageable.getSort().getOrderFor("createdAt");
        assertNotNull(order);
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    @DisplayName("Should correctly bind flat parameters: status=POSTED, page=0, size=10, sort=createdAt,desc")
    void testFlatParametersBinding() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addParameter("status", "POSTED");
        request.addParameter("page", "0");
        request.addParameter("size", "10");
        request.addParameter("sort", "createdAt,desc");

        Page<StockMovement> pageResult = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageResult);

        StockMovementFilterRequest filterRequest = new StockMovementFilterRequest();
        ResponseEntity<ApiResponse<List<StockMovementResponse>>> result = controller.getAll(filterRequest, null, companyId, request);

        PaginationResponse pagination = result.getBody().getPagination();
        assertNotNull(pagination);
        assertEquals(0, pagination.getPage());
        assertEquals(10, pagination.getSize());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable passedPageable = pageableCaptor.getValue();
        assertEquals(0, passedPageable.getPageNumber());
        assertEquals(10, passedPageable.getPageSize());
        Sort.Order order = passedPageable.getSort().getOrderFor("createdAt");
        assertNotNull(order);
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    @DisplayName("Should handle missing status parameter by returning all records without status predicate")
    void testMissingStatusParameter() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addParameter("pageable.page", "0");
        request.addParameter("pageable.size", "10");

        Page<StockMovement> pageResult = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageResult);

        StockMovementFilterRequest filterRequest = new StockMovementFilterRequest();
        ResponseEntity<ApiResponse<List<StockMovementResponse>>> result = controller.getAll(filterRequest, null, companyId, request);

        assertNotNull(result.getBody());
        assertEquals(0, result.getBody().getPagination().getPage());
        assertEquals(10, result.getBody().getPagination().getSize());
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("StockMovementSpecification builds without error for populated and null filters")
    void testSpecificationBuilder() {
        StockMovementFilterRequest filter = new StockMovementFilterRequest();
        filter.setStatus("POSTED");
        filter.setMovementType("IN");
        Specification<StockMovement> spec = StockMovementSpecification.getFilterSpecification(filter, companyId);
        assertNotNull(spec);

        Specification<StockMovement> emptySpec = StockMovementSpecification.getFilterSpecification(null, companyId);
        assertNotNull(emptySpec);
    }
}
