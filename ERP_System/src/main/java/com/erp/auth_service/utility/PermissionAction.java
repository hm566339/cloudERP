package com.erp.auth_service.utility;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum PermissionAction {
    READ,
    CREATE,
    UPDATE,
    WRITE,
    DELETE,
    APPROVE,
    REJECT,
    RETURN,
    DELEGATE,
    CANCEL,
    ACTIVATE,
    DEACTIVATE,
    EXPORT;

    public static final Set<String> NAMES = Arrays.stream(values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    public static boolean isValid(String action) {
        if (action == null) {
            return false;
        }
        return NAMES.contains(action.trim().toUpperCase());
    }
}
