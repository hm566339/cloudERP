package com.erp.crm.common.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Unified API response envelope for all endpoints.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true;

    @Builder.Default
    private String message = "Request processed successfully";

    private T data;

    private List<String> errors;

    @Builder.Default
    private int status = HttpStatus.OK.value();

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private PaginationResponse pagination;

    private Map<String, Object> metadata;

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK.value())
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message, HttpStatus status) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(null)
                .status(HttpStatus.OK.value())
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<List<T>> paginated(Page<T> page, String message) {
        return ApiResponse.<List<T>>builder()
                .success(true)
                .message(message)
                .data(page.getContent())
                .pagination(PaginationResponse.builder()
                        .page(page.getNumber())
                        .size(page.getSize())
                        .totalElements(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .hasNext(page.hasNext())
                        .hasPrevious(page.hasPrevious())
                        .first(page.isFirst())
                        .last(page.isLast())
                        .currentPage(page.getNumber())
                        .pageSize(page.getSize())
                        .numberOfElements(page.getNumberOfElements())
                        .build())
                .status(HttpStatus.OK.value())
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, List<String> errors, HttpStatus status) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errors(errors)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String error, HttpStatus status) {
        return error(message, List.of(error), status);
    }

    public static <T> ApiResponse<T> error(String message, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @SuppressWarnings("unchecked")
    public static <T> ApiResponse<T> validationError(Map<String, String> fieldErrors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message("Validation Failed")
                .data((T) fieldErrors)
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
