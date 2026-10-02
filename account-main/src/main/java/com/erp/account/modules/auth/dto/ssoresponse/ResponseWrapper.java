package com.erp.account.modules.auth.dto.ssoresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResponseWrapper<T> {

    private boolean success;
    private String message;
    private T data;

    public static <T> ResponseWrapper<T> success(T data) {
        return ResponseWrapper.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .build();
    }

    public static <T> ResponseWrapper<T> success(String message, T data) {
        return ResponseWrapper.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static ResponseWrapper<Object> error(String message) {
        return error(message, Map.of());
    }

    public static <T> ResponseWrapper<T> error(String message, T data) {
        return ResponseWrapper.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .build();
    }
}
