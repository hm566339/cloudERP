package com.erp.crm.modules.account.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum DecisionMakerRole {
    DECISION_MAKER,
    ECONOMIC_BUYER,
    CHAMPION,
    TECHNICAL_EVALUATOR,
    EVALUATOR,
    INFLUENCER,
    END_USER,
    GATEKEEPER;

    @JsonCreator
    public static DecisionMakerRole fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return EVALUATOR;
        }
        String normalized = value.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        for (DecisionMakerRole role : DecisionMakerRole.values()) {
            if (role.name().equalsIgnoreCase(normalized)) {
                return role;
            }
        }
        // Fallback / alias matching for MEDDIC and legacy conventions
        return switch (normalized) {
            case "ECONOMIC_BUYER", "ECONOMICBUYER", "BUYER" -> ECONOMIC_BUYER;
            case "CHAMPION" -> CHAMPION;
            case "TECHNICAL_EVALUATOR", "TECHNICALEVALUATOR" -> TECHNICAL_EVALUATOR;
            case "GATEKEEPER" -> GATEKEEPER;
            case "END_USER", "ENDUSER", "USER" -> END_USER;
            case "INFLUENCER" -> INFLUENCER;
            case "DECISION_MAKER", "DECISIONMAKER" -> DECISION_MAKER;
            default -> EVALUATOR;
        };
    }
}
