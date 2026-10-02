package com.erp.auth_service.dto.request;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
public class UpdateComapnyModule {

    private UUID company;

    private UUID module;

    private Boolean active;
}
