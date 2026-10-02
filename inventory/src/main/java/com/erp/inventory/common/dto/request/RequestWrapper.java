package com.erp.inventory.common.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic request wrapper for all API requests.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequestWrapper<T> {

    @Valid
    @NotNull
    private T data;

    public T unwrap() {
        return this.data;
    }

    public static <T> RequestWrapper<T> of(T data) {
        return RequestWrapper.<T>builder()
                .data(data)
                .build();
    }
}
