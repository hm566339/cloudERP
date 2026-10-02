package com.erp.account.common.handler;

import com.erp.account.common.dto.response.ApiResponse;
import org.springframework.security.access.AccessDeniedException;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.BaseApplicationException;
import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.DatabaseOperationException;
import com.erp.account.common.exception.DuplicateResourceException;
import com.erp.account.common.exception.ExternalServiceException;
import com.erp.account.common.exception.FileStorageException;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.exception.InternalServerException;
import com.erp.account.common.exception.InvalidOperationException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.common.exception.BankTransactionNotFoundException;
import com.erp.account.common.exception.DuplicateReceiptException;
import com.erp.account.common.exception.DuplicateReferenceException;
import com.erp.account.common.exception.DuplicateUtrException;
import com.erp.account.common.exception.InvalidBankAccountException;
import com.erp.account.common.exception.InvalidBankTransactionException;
import com.erp.account.common.exception.InvalidCustomerException;
import com.erp.account.common.exception.InvalidDebitCreditException;
import com.erp.account.common.exception.InvalidReceiptAllocationException;
import com.erp.account.common.exception.ReceiptVoucherNotFoundException;
import com.erp.account.common.exception.VendorNotFoundException;
import com.erp.account.common.exception.CompanySelectionException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import org.springframework.core.NestedExceptionUtils;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(com.erp.account.common.exception.BusinessValidationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleBusinessValidationException(com.erp.account.common.exception.BusinessValidationException ex,
            HttpServletRequest request) {
        Map<String, String> data = new HashMap<>();
        data.put("code", ex.getErrorCode());
        data.put("field", ex.getField());
        data.put("message", ex.getMessage());
        
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .data(data)
                .status(HttpStatus.BAD_REQUEST.value())
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.data.core.PropertyReferenceException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handlePropertyReferenceException(
            org.springframework.data.core.PropertyReferenceException ex, HttpServletRequest request) {
        log.warn("Invalid sort property in request {}: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, "PropertyReferenceException");
    }

    @ExceptionHandler(BaseApplicationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleBaseApplicationException(BaseApplicationException ex,
            HttpServletRequest request) {
        HttpStatus status = resolveStatus(ex);
        return buildErrorResponse(ex.getMessage(), status, ex.getClass().getSimpleName());
    }

    @ExceptionHandler({ReceiptVoucherNotFoundException.class, VendorNotFoundException.class,
            BankTransactionNotFoundException.class})
    public ResponseEntity<ApiResponse<Map<String, String>>> handleNotFoundRuntimeExceptions(RuntimeException ex,
            HttpServletRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, ex.getClass().getSimpleName());
    }

    @ExceptionHandler({DuplicateReceiptException.class, DuplicateReferenceException.class, DuplicateUtrException.class})
    public ResponseEntity<ApiResponse<Map<String, String>>> handleDuplicateRuntimeExceptions(RuntimeException ex,
            HttpServletRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, ex.getClass().getSimpleName());
    }

    @ExceptionHandler({InvalidReceiptAllocationException.class, InvalidCustomerException.class,
            InvalidBankAccountException.class, InvalidBankTransactionException.class,
            InvalidDebitCreditException.class})
    public ResponseEntity<ApiResponse<Map<String, String>>> handleInvalidRuntimeExceptions(RuntimeException ex,
            HttpServletRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, ex.getClass().getSimpleName());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation Failed")
                .data(fieldErrors)
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();
        log.warn("Validation failed: {}", ex.getMessage());
        return new ResponseEntity<>(response, new HttpHeaders(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        String paramName = ex.getName();
        Class<?> requiredType = ex.getRequiredType();

        if (requiredType != null && java.util.UUID.class.equals(requiredType)) {
            String message = "Invalid " + paramName + " format. Expected a valid UUID.";
            return buildErrorResponse(message, HttpStatus.BAD_REQUEST, ex.getClass().getSimpleName());
        }

        String message = "Invalid parameter: " + paramName;
        return buildErrorResponse(message, HttpStatus.BAD_REQUEST, ex.getClass().getSimpleName());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(ConstraintViolationException ex,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getConstraintViolations()
                .forEach(violation -> fieldErrors.put(
                        violation.getPropertyPath().toString(),
                        violation.getMessage()
                ));

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation Failed")
                .data(fieldErrors)
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();
        log.warn("Constraint violation: {}", ex.getMessage());
        return new ResponseEntity<>(response, new HttpHeaders(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpServletRequest request) {
        Map<String, String> errorData = new HashMap<>();
        errorData.put("error", ex.getClass().getSimpleName());
        errorData.put("details", ex.getMessage());

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Malformed JSON request")
                .data(errorData)
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();
        log.warn("Malformed JSON request: {}", ex.getMessage());
        return new ResponseEntity<>(response, new HttpHeaders(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        fieldErrors.put(ex.getParameterName(), "Required request parameter is missing");

        ApiResponse<Map<String, String>> response = ApiResponse.validationError(fieldErrors);
        log.warn("Missing request parameter: {}", ex.getParameterName());
        return new ResponseEntity<>(response, new HttpHeaders(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleDataIntegrityViolation(DataIntegrityViolationException ex,
            HttpServletRequest request) {
        Throwable root = NestedExceptionUtils.getMostSpecificCause(ex);
        log.error("Data Integrity Violation Root Cause: {}", root.getMessage(), root);

        String tableName = null;
        String columnName = null;
        String detailMessage = null;
        String constraintName = null;

        if (root instanceof PSQLException psql) {
            ServerErrorMessage server = psql.getServerErrorMessage();
            if (server != null) {
                tableName = server.getTable();
                columnName = server.getColumn();
                detailMessage = server.getDetail();
                constraintName = server.getConstraint();
                log.error("PostgreSQL Constraint Details -> Table: {}, Column: {}, Detail: {}, Constraint: {}",
                        tableName, columnName, detailMessage, constraintName);
            }
        }

        String userFriendlyMessage = "Database constraint violation";
        HttpStatus status = HttpStatus.CONFLICT;

        String rootMsg = root.getMessage() != null ? root.getMessage() : ex.getMessage();
        if (rootMsg != null) {
            String lowerMsg = rootMsg.toLowerCase();
            if (lowerMsg.contains("value too long for type character varying(3)") || lowerMsg.contains("value too long")) {
                status = HttpStatus.BAD_REQUEST;
                if (columnName != null) {
                    userFriendlyMessage = "Value too long for column '" + columnName + "' (max 3 characters allowed).";
                } else {
                    userFriendlyMessage = "Database constraint violation: " + rootMsg;
                }
            } else if (lowerMsg.contains("uk_vendor_gstin") || lowerMsg.contains("gstin")) {
                userFriendlyMessage = "Vendor with this GSTIN already exists.";
            } else if (lowerMsg.contains("uk_vendor_pan") || lowerMsg.contains("pan")) {
                userFriendlyMessage = "Vendor with this PAN already exists.";
            } else if (lowerMsg.contains("uk_vendor_code") || lowerMsg.contains("vendor_code")) {
                userFriendlyMessage = "Vendor with this Vendor Code already exists.";
            } else if (lowerMsg.contains("foreign key") || lowerMsg.contains("fk_")) {
                userFriendlyMessage = "Referenced foreign key entity does not exist.";
                status = HttpStatus.BAD_REQUEST;
            } else if (lowerMsg.contains("not-null") || lowerMsg.contains("null value")) {
                userFriendlyMessage = "Required field cannot be null in database.";
                status = HttpStatus.BAD_REQUEST;
            } else {
                userFriendlyMessage = "Database constraint violation: " + rootMsg;
            }
        }

        Map<String, String> errorData = new HashMap<>();
        errorData.put("error", ex.getClass().getSimpleName());
        errorData.put("rootCause", rootMsg);
        if (tableName != null) errorData.put("table", tableName);
        if (columnName != null) errorData.put("column", columnName);
        if (detailMessage != null) errorData.put("detail", detailMessage);
        if (constraintName != null) errorData.put("constraint", constraintName);

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message(userFriendlyMessage)
                .data(errorData)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(response, new HttpHeaders(), status);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex,
            HttpServletRequest request) {
        log.warn("Access denied error: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", "Forbidden");
        body.put("error", "User does not have permission to access this resource");
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(org.springframework.security.core.AuthenticationException ex,
            HttpServletRequest request) {
        log.warn("Authentication error: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", "Unauthorized");
        body.put("error", "Authentication token is missing or invalid");
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedException(UnauthorizedException ex,
            HttpServletRequest request) {
        log.warn("Unauthorized application exception: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("message", "Unauthorized");
        body.put("error", "Authentication token is missing or invalid");
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(java.lang.SecurityException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleSecurityException(java.lang.SecurityException ex,
            HttpServletRequest request) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleRuntimeException(RuntimeException ex,
            HttpServletRequest request) {
        HttpStatus status = resolveRuntimeStatus(ex);
        logException(ex, status);
        return buildErrorResponse(ex.getMessage(), status, ex.getClass().getSimpleName());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleNoResourceFoundException(NoResourceFoundException ex,
            HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getResourcePath());
        return buildErrorResponse("The requested API endpoint or resource was not found.", HttpStatus.NOT_FOUND,
                ex.getClass().getSimpleName());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleGenericException(Exception ex,
            HttpServletRequest request) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return buildErrorResponse("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getClass().getSimpleName());
    }

    private HttpStatus resolveStatus(BaseApplicationException ex) {
        if (ex instanceof ResourceNotFoundException || ex.getClass().getSimpleName().endsWith("NotFoundException")) {
            return HttpStatus.NOT_FOUND;
        }
        if (ex instanceof DuplicateResourceException || ex instanceof ConflictException
                || ex.getClass().getSimpleName().startsWith("Duplicate")) {
            return HttpStatus.CONFLICT;
        }
        if (ex instanceof UnauthorizedException) {
            return HttpStatus.UNAUTHORIZED;
        }
        if (ex instanceof ForbiddenException || ex instanceof com.erp.account.common.exception.SalesInvoiceAlreadyPostedException
                || ex instanceof com.erp.account.common.exception.InvoiceAlreadyPostedException
                || ex instanceof com.erp.account.common.exception.CustomerDeletedException
                || ex instanceof com.erp.account.common.exception.VendorDeletedException) {
            return HttpStatus.FORBIDDEN;
        }
        if (ex instanceof BadRequestException || ex instanceof ValidationException
                || ex instanceof InvalidOperationException || ex instanceof CompanySelectionException) {
            return HttpStatus.BAD_REQUEST;
        }
        if (ex instanceof BusinessException) {
            return HttpStatus.UNPROCESSABLE_ENTITY;
        }
        if (ex instanceof DatabaseOperationException || ex instanceof FileStorageException
                || ex instanceof ExternalServiceException || ex instanceof InternalServerException) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return HttpStatus.BAD_REQUEST;
    }

    private HttpStatus resolveRuntimeStatus(RuntimeException ex) {
        String simpleName = ex.getClass().getSimpleName();
        if (simpleName.endsWith("NotFoundException")) {
            return HttpStatus.NOT_FOUND;
        }
        if (simpleName.startsWith("Duplicate") || ex instanceof ConflictException) {
            return HttpStatus.CONFLICT;
        }
        if (simpleName.startsWith("Invalid") || ex instanceof BadRequestException) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private ResponseEntity<ApiResponse<Map<String, String>>> buildErrorResponse(String message,
            HttpStatus status, String errorCode) {
        Map<String, String> data = new HashMap<>();
        data.put("error", errorCode);

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message(message != null ? message : "Unexpected error")
                .data(data)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .errors(new java.util.ArrayList<>())
                .build();
        return new ResponseEntity<>(response, new HttpHeaders(), status);
    }

    private void logException(Exception ex, HttpStatus status) {
        if (status.is5xxServerError()) {
            log.error("Handled exception [{}]: {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        } else {
            log.warn("Handled exception [{}]: {}", ex.getClass().getSimpleName(), ex.getMessage());
        }
    }
}
