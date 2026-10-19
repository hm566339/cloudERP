package com.erp.manufacturing.security.dto.sso;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResponseWrapper<T> {

    private boolean success;
    private String message;
    private T data;

    public static <T> ResponseWrapper<T> success(T data) {
        return ResponseWrapper.<T>builder().success(true).data(data).build();
    }
}
