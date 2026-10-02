package com.erp.inventory.modules.stock.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.stock.dto.request.StockMovementFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementResponse;
import com.erp.inventory.modules.stock.service.StockMovementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory/stock-movements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockMovementResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockMovementResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getAll(
            StockMovementFilterRequest filter,
            Pageable pageable,
            @RequestParam(required = false) UUID companyId,
            HttpServletRequest request) {

        StockMovementFilterRequest resolvedFilter = resolveFilter(filter, request);
        Pageable resolvedPageable = resolvePageable(pageable, request);
        UUID resolvedCompanyId = (companyId != null) ? companyId : extractCompanyId(request);

        Page<StockMovementResponse> page = service.getAll(resolvedFilter, resolvedPageable, resolvedCompanyId);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    private StockMovementFilterRequest resolveFilter(StockMovementFilterRequest filter, HttpServletRequest request) {
        if (filter == null) {
            filter = new StockMovementFilterRequest();
        }
        if (request == null) {
            return filter;
        }

        if (!StringUtils.hasText(filter.getStatus())) {
            String status = getFirstParam(request, "filter.status", "status");
            if (StringUtils.hasText(status)) {
                filter.setStatus(status.trim());
            }
        }

        if (!StringUtils.hasText(filter.getMovementType())) {
            String movementType = getFirstParam(request, "filter.movementType", "movementType");
            if (StringUtils.hasText(movementType)) {
                filter.setMovementType(movementType.trim());
            }
        }

        if (!StringUtils.hasText(filter.getMovementNo())) {
            String movementNo = getFirstParam(request, "filter.movementNo", "movementNo");
            if (StringUtils.hasText(movementNo)) {
                filter.setMovementNo(movementNo.trim());
            }
        }

        if (!StringUtils.hasText(filter.getReferenceNumber())) {
            String refNum = getFirstParam(request, "filter.referenceNumber", "referenceNumber");
            if (StringUtils.hasText(refNum)) {
                filter.setReferenceNumber(refNum.trim());
            }
        }

        if (!StringUtils.hasText(filter.getSearchKey())) {
            String searchKey = getFirstParam(request, "filter.searchKey", "searchKey");
            if (StringUtils.hasText(searchKey)) {
                filter.setSearchKey(searchKey.trim());
            }
        }

        if (filter.getReferenceType() == null) {
            String refType = getFirstParam(request, "filter.referenceType", "referenceType");
            if (StringUtils.hasText(refType)) {
                try {
                    filter.setReferenceType(ReferenceType.valueOf(refType.trim().toUpperCase()));
                } catch (IllegalArgumentException ignored) {}
            }
        }

        if (filter.getReferenceId() == null) {
            String refId = getFirstParam(request, "filter.referenceId", "referenceId");
            if (StringUtils.hasText(refId)) {
                try {
                    filter.setReferenceId(UUID.fromString(refId.trim()));
                } catch (IllegalArgumentException ignored) {}
            }
        }

        return filter;
    }

    private Pageable resolvePageable(Pageable pageable, HttpServletRequest request) {
        int page = 0;
        int size = 20;

        String pageParam = getFirstParam(request, "pageable.page", "page");
        if (StringUtils.hasText(pageParam)) {
            try {
                page = Integer.parseInt(pageParam.trim());
            } catch (NumberFormatException ignored) {}
        } else if (pageable != null && pageable.isPaged()) {
            page = pageable.getPageNumber();
        }

        String sizeParam = getFirstParam(request, "pageable.size", "size");
        if (StringUtils.hasText(sizeParam)) {
            try {
                size = Integer.parseInt(sizeParam.trim());
            } catch (NumberFormatException ignored) {}
        } else if (pageable != null && pageable.isPaged()) {
            size = pageable.getPageSize();
        }

        if (page < 0) page = 0;
        if (size <= 0) size = 20;

        Sort sort = resolveSort(pageable, request);

        return PageRequest.of(page, size, sort);
    }

    private Sort resolveSort(Pageable pageable, HttpServletRequest request) {
        if (request != null) {
            String[] sortParams = request.getParameterValues("pageable.sort");
            if (sortParams == null || sortParams.length == 0) {
                sortParams = request.getParameterValues("sort");
            }
            if (sortParams != null && sortParams.length > 0) {
                List<Sort.Order> orders = new ArrayList<>();
                for (String sortEntry : sortParams) {
                    if (!StringUtils.hasText(sortEntry)) continue;
                    String[] entries = sortEntry.split(";");
                    for (String entry : entries) {
                        if (!StringUtils.hasText(entry)) continue;
                        String[] tokens = entry.split(",");
                        String property = tokens[0].trim();
                        if (!property.isEmpty()) {
                            Sort.Direction direction = Sort.Direction.ASC;
                            if (tokens.length > 1 && "desc".equalsIgnoreCase(tokens[1].trim())) {
                                direction = Sort.Direction.DESC;
                            }
                            orders.add(new Sort.Order(direction, property));
                        }
                    }
                }
                if (!orders.isEmpty()) {
                    return Sort.by(orders);
                }
            }
        }

        if (pageable != null && pageable.getSort().isSorted()) {
            return pageable.getSort();
        }

        return Sort.unsorted();
    }

    private String getFirstParam(HttpServletRequest request, String... names) {
        if (request == null) return null;
        for (String name : names) {
            String val = request.getParameter(name);
            if (StringUtils.hasText(val)) {
                return val;
            }
        }
        return null;
    }

    private UUID extractCompanyId(HttpServletRequest request) {
        if (request == null) return null;
        String val = getFirstParam(request, "companyId", "filter.companyId");
        if (StringUtils.hasText(val)) {
            try {
                return UUID.fromString(val.trim());
            } catch (IllegalArgumentException ignored) {}
        }
        return null;
    }
}
