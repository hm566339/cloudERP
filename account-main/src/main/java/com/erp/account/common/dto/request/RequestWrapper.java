package com.erp.account.common.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic request wrapper for all API requests.
 * 
 * Expected request format:
 * {
 *   "data": { actual request payload }
 * }
 * 
 * @param <T> The type of the actual request payload
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequestWrapper<T> {

    /**
     * The actual request payload/data to be processed. Marked with @Valid so
     * controller-level @Valid on RequestWrapper will cascade validation to the
     * wrapped payload fields.
     */
    @Valid
    @NotNull
    private T data;

    /**
     * Extract the wrapped data from the request
     * 
     * @return The unwrapped data object
     */
    public T unwrap() {
        return this.data;
    }

    /**
     * Create a new RequestWrapper with the given data
     * 
     * @param data The data to wrap
     * @param <T> Type of data
     * @return A new RequestWrapper instance
     */
    public static <T> RequestWrapper<T> of(T data) {
        return RequestWrapper.<T>builder()
                .data(data)
                .build();
    }
}
