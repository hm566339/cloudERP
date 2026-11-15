package com.erp.crm.common.exception;

import com.erp.crm.common.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(ex.getMessage(), "Resource Not Found", HttpStatus.NOT_FOUND),
                HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(TenantMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTenantMismatchException(TenantMismatchException ex) {
        // Return 404 to avoid leaking existence of the resource
        return new ResponseEntity<>(
                ApiResponse.error("Resource not found", "Resource Not Found", HttpStatus.NOT_FOUND),
                HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler({BusinessValidationException.class, InsufficientStockException.class})
    public ResponseEntity<ApiResponse<Object>> handleBusinessExceptions(RuntimeException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(ex.getMessage(), "Business Validation Failed", HttpStatus.BAD_REQUEST),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Object>> handleConflictException(ConflictException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(ex.getMessage(), "Conflict", HttpStatus.CONFLICT),
                HttpStatus.CONFLICT
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        return new ResponseEntity<>(
                ApiResponse.validationError(fieldErrors),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(org.springframework.data.mapping.PropertyReferenceException.class)
    public ResponseEntity<ApiResponse<Object>> handlePropertyReferenceException(org.springframework.data.mapping.PropertyReferenceException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(ex.getMessage(), "Invalid Sort Property", HttpStatus.BAD_REQUEST),
                HttpStatus.BAD_REQUEST
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
        return new ResponseEntity<>(
                ApiResponse.error("An unexpected error occurred.", ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
