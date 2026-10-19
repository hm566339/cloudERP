package com.erp.manufacturing.integration.inventory.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private List<String> errors;
    private int status;
    private LocalDateTime timestamp;

    public static <T> InventoryApiResponse<T> success(T data) {
        return InventoryApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .status(200)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
