package com.erp.account.common.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Generic response wrapper for all API responses.
 * 
 * Standard response format:
 * {
 *   "success": true,
 *   "message": "Operation completed successfully",
 *   "data": { actual response payload }
 * }
 * 
 * Error response format:
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "data": { field-level errors or additional error details }
 * }
 * 
 * Validation error format:
 * {
 *   "success": false,
 *   "message": "Validation Failed",
 *   "data": {
 *     "fieldName": "error message",
 *     "anotherField": "another error"
 *   }
 * }
 * 
 * @param <T> The type of the response data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponseWrapper<T> {

    /**
     * Indicates whether the operation was successful
     */
    @Builder.Default
    private Boolean success = true;

    /**
     * Human-readable message describing the result
     */
    @Builder.Default
    private String message = "Success";

    /**
     * The actual response data/payload
     */
    private T data;

    /**
     * Timestamp of when the response was generated
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ============================================================
    // FACTORY METHODS
    // ============================================================

    /**
     * Create a successful response with only data
     * 
     * @param data The response data
     * @param <T> Type of data
     * @return ResponseWrapper with success=true
     */
    public static <T> ResponseWrapper<T> success(T data) {
        return ResponseWrapper.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a successful response with message and data
     * 
     * @param message Custom success message
     * @param data The response data
     * @param <T> Type of data
     * @return ResponseWrapper with success=true
     */
    public static <T> ResponseWrapper<T> success(String message, T data) {
        return ResponseWrapper.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a successful response with message only
     * 
     * @param message Success message
     * @param <T> Type of data
     * @return ResponseWrapper with success=true and data=null
     */
    public static <T> ResponseWrapper<T> success(String message) {
        return ResponseWrapper.<T>builder()
                .success(true)
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create an error response with message only
     * 
     * @param message Error message
     * @param <T> Type of data (typically Map for field errors)
     * @return ResponseWrapper with success=false
     */
    public static <T> ResponseWrapper<T> error(String message) {
        return ResponseWrapper.<T>builder()
                .success(false)
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create an error response with message and error details
     * 
     * @param message Error message
     * @param data Error details (field errors, exception details, etc.)
     * @param <T> Type of data
     * @return ResponseWrapper with success=false
     */
    public static <T> ResponseWrapper<T> error(String message, T data) {
        return ResponseWrapper.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a validation error response
     * 
     * Commonly used with Map<String, String> containing field names and error messages
     * 
     * @param fieldErrors Map of field names to error messages
     * @param <T> Type of data (typically Map)
     * @return ResponseWrapper indicating validation failure
     */
    @SuppressWarnings("unchecked")
    public static <T> ResponseWrapper<T> validationError(Map<String, String> fieldErrors) {
        return ResponseWrapper.<T>builder()
                .success(false)
                .message("Validation Failed")
                .data((T) fieldErrors)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
