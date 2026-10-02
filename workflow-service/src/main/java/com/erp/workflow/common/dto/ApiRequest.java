package com.erp.workflow.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Standard API wrapper for all request bodies.
 * All workflow API requests must use: { "data": { ... } }
 */
@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiRequest<T> {
    private T data;
}
