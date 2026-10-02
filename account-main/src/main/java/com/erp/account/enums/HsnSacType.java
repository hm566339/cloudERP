package com.erp.account.enums;

import lombok.Getter;

@Getter
public enum HsnSacType {
    HSN("Goods"),
    SAC("Services");

    private final String description;

    HsnSacType(String description) {
        this.description = description;
    }

    public boolean isValidCode(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        return code.matches("^[A-Za-z0-9\\-]{4,20}$");
    }
}
