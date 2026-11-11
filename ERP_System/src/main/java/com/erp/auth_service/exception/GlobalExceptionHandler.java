package com.erp.auth_service.exception;

import com.erp.auth_service.dto.response.ResponseWrapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        // 404
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleNotFound(
                        ResourceNotFoundException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.NOT_FOUND, Map.of());
        }

        @ExceptionHandler(CompanyServiceException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleCompanyService(
                        CompanyServiceException ex,
                        HttpServletRequest request) {

                return buildResponse(
                                ex.getMessage(),
                                HttpStatus.BAD_GATEWAY,
                                Map.of());
        }

        // 409
        @ExceptionHandler(DuplicateResourceException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleDuplicate(
                        DuplicateResourceException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.CONFLICT, Map.of());
        }

        // 409 - Non Unique / Multiple Results Query Exception
        @ExceptionHandler({
                org.springframework.dao.IncorrectResultSizeDataAccessException.class,
                jakarta.persistence.NonUniqueResultException.class,
                org.hibernate.NonUniqueResultException.class
        })
        public ResponseEntity<ResponseWrapper<Object>> handleNonUniqueResult(
                        Exception ex,
                        HttpServletRequest request) {
                log.warn("Multiple records found where single result expected: {}", ex.getMessage());
                return buildResponse(
                                "Data conflict: Query returned multiple records where a unique record was expected",
                                HttpStatus.CONFLICT,
                                Map.of());
        }

        // 409 - Data Integrity / Database Constraint Violations
        @ExceptionHandler({
                org.springframework.dao.DataIntegrityViolationException.class,
                org.hibernate.exception.ConstraintViolationException.class
        })
        public ResponseEntity<ResponseWrapper<Object>> handleDataIntegrityViolation(
                        Exception ex,
                        HttpServletRequest request) {
                log.warn("Database integrity violation: {}", ex.getMessage());
                return buildResponse(
                                "Data integrity conflict: A record with conflicting values already exists",
                                HttpStatus.CONFLICT,
                                Map.of());
        }

        // 403 - Spring Security Access Denied
        @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleAccessDenied(
                        org.springframework.security.access.AccessDeniedException ex,
                        HttpServletRequest request) {
                return buildResponse(
                                "Access denied: You do not have permission to access this resource",
                                HttpStatus.FORBIDDEN,
                                Map.of());
        }

        // 404 - JPA Entity Not Found
        @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleEntityNotFound(
                        jakarta.persistence.EntityNotFoundException ex,
                        HttpServletRequest request) {
                return buildResponse(
                                ex.getMessage() != null ? ex.getMessage() : "Requested resource not found",
                                HttpStatus.NOT_FOUND,
                                Map.of());
        }

        @ExceptionHandler(ServerConnectionFailedException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleServerConnectionFailedException(
                        ServerConnectionFailedException ex,
                        HttpServletRequest request) {

                return buildResponse(
                                ex.getMessage(),
                                HttpStatus.SERVICE_UNAVAILABLE,
                                Map.of());
        }

        // 401
        @ExceptionHandler(UnauthorizedException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleUnauthorized(
                        UnauthorizedException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, Map.of());
        }

        // 403
        @ExceptionHandler(ForbiddenException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleForbidden(
                        ForbiddenException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.FORBIDDEN, Map.of());
        }

        @ExceptionHandler(EmailNotVerifiedException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleEmailNotVerified(EmailNotVerifiedException ex) {
                return new ResponseEntity<>(
                                ResponseWrapper.error(ex.getMessage()),
                                HttpStatus.FORBIDDEN);
        }

        @ExceptionHandler(SessionLimitExceededException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleSessionLimitExceeded(SessionLimitExceededException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ResponseWrapper.error(ex.getMessage()));
        }

        // 400 - Custom
        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleBadRequest(
                        BadRequestException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, Map.of());
        }

        // Validation (@Valid)
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ResponseWrapper<Map<String, String>>> handleValidation(
                        MethodArgumentNotValidException ex,
                        HttpServletRequest request) {

                Map<String, String> errors = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .collect(Collectors.toMap(
                                                fieldError -> fieldError.getField(),
                                                fieldError -> fieldError.getDefaultMessage(),
                                                (existing, replacement) -> existing));

                return ResponseEntity.badRequest().body(
                                ResponseWrapper.error("Validation Failed", errors));
        }

        // Constraint (@PathVariable, @RequestParam)
        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ResponseWrapper<Map<String, String>>> handleConstraint(
                        ConstraintViolationException ex,
                        HttpServletRequest request) {

                Map<String, String> errors = ex.getConstraintViolations()
                                .stream()
                                .collect(Collectors.toMap(
                                                violation -> violation.getPropertyPath().toString(),
                                                violation -> violation.getMessage(),
                                                (existing, replacement) -> existing));

                return ResponseEntity.badRequest().body(
                                ResponseWrapper.error("Validation Failed", errors));
        }

        // 401
        @ExceptionHandler({ BadCredentialsException.class,
                        org.springframework.security.authentication.BadCredentialsException.class })
        public ResponseEntity<ResponseWrapper<Object>> handleBadCredentials(
                        Exception ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, Map.of());
        }

        @ExceptionHandler(org.springframework.web.bind.ServletRequestBindingException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleServletRequestBinding(
                        org.springframework.web.bind.ServletRequestBindingException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, Map.of());
        }

        // 423 (Account Locked)
        @ExceptionHandler(AccountLockedException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleAccountLocked(
                        AccountLockedException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.LOCKED, Map.of());
        }

        // Token Expired
        @ExceptionHandler(TokenExpiredException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleTokenExpired(
                        TokenExpiredException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, Map.of());
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        HttpServletRequest request) {

                return buildResponse(
                                "Invalid request value: " + ex.getValue(),
                                HttpStatus.BAD_REQUEST,
                                Map.of());
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleIllegalArgument(
                        IllegalArgumentException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, Map.of());
        }

        @ExceptionHandler(InvalidOperationException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleInvalidOperation(
                        InvalidOperationException ex,
                        HttpServletRequest request) {

                return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, Map.of());
        }

        @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleHttpMessageNotReadable(
                        org.springframework.http.converter.HttpMessageNotReadableException ex,
                        HttpServletRequest request) {
                log.warn("Malformed HTTP request payload: {}", ex.getMessage());
                return buildResponse("Malformed request body or invalid JSON", HttpStatus.BAD_REQUEST, Map.of());
        }

        @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleMethodNotSupported(
                        org.springframework.web.HttpRequestMethodNotSupportedException ex,
                        HttpServletRequest request) {
                return buildResponse(ex.getMessage(), HttpStatus.METHOD_NOT_ALLOWED, Map.of());
        }

        @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleNoResourceFound(
                        org.springframework.web.servlet.resource.NoResourceFoundException ex,
                        HttpServletRequest request) {
                log.warn("Static resource or endpoint not found: {} {}", request.getMethod(), request.getRequestURI());
                return buildResponse("Endpoint not found: " + request.getRequestURI(), HttpStatus.NOT_FOUND, Map.of());
        }

        @ExceptionHandler(org.hibernate.LazyInitializationException.class)
        public ResponseEntity<ResponseWrapper<Object>> handleLazyInitialization(
                        org.hibernate.LazyInitializationException ex,
                        HttpServletRequest request) {
                log.error("LazyInitializationException: ", ex);
                return buildResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, Map.of());
        }

        // 500 - Generic
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ResponseWrapper<Object>> handleGlobal(
                        Exception ex,
                        HttpServletRequest request) {
                log.error("Internal server error: ", ex);
                return buildResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, Map.of());
        }

        private ResponseEntity<ResponseWrapper<Object>> buildResponse(
                        String message,
                        HttpStatus status,
                        Map<String, Object> data) {

                return new ResponseEntity<>(
                                ResponseWrapper.error(message, data),
                                status);
        }
}