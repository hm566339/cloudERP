package com.erp.crm.modules.account.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DecisionMakerRoleTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Should successfully deserialize ECONOMIC_BUYER from JSON")
    void shouldDeserializeEconomicBuyer() throws Exception {
        String json = "\"ECONOMIC_BUYER\"";
        DecisionMakerRole role = objectMapper.readValue(json, DecisionMakerRole.class);
        assertEquals(DecisionMakerRole.ECONOMIC_BUYER, role);
    }

    @Test
    @DisplayName("Should successfully deserialize all MEDDIC and CRM roles")
    void shouldDeserializeAllRoles() throws Exception {
        assertEquals(DecisionMakerRole.ECONOMIC_BUYER, objectMapper.readValue("\"ECONOMIC_BUYER\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.CHAMPION, objectMapper.readValue("\"CHAMPION\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.TECHNICAL_EVALUATOR, objectMapper.readValue("\"TECHNICAL_EVALUATOR\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.DECISION_MAKER, objectMapper.readValue("\"DECISION_MAKER\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.INFLUENCER, objectMapper.readValue("\"INFLUENCER\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.EVALUATOR, objectMapper.readValue("\"EVALUATOR\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.END_USER, objectMapper.readValue("\"END_USER\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.GATEKEEPER, objectMapper.readValue("\"GATEKEEPER\"", DecisionMakerRole.class));
    }

    @Test
    @DisplayName("Should handle case-insensitive strings and formatted labels gracefully")
    void shouldHandleCaseInsensitiveAndFormattedStrings() throws Exception {
        assertEquals(DecisionMakerRole.ECONOMIC_BUYER, objectMapper.readValue("\"economic_buyer\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.ECONOMIC_BUYER, objectMapper.readValue("\"Economic Buyer\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.TECHNICAL_EVALUATOR, objectMapper.readValue("\"Technical Evaluator\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.CHAMPION, objectMapper.readValue("\"champion\"", DecisionMakerRole.class));
    }

    @Test
    @DisplayName("Should fallback to EVALUATOR on unknown or empty string without throwing exception")
    void shouldFallbackOnUnknown() throws Exception {
        assertEquals(DecisionMakerRole.EVALUATOR, objectMapper.readValue("\"UNKNOWN_ROLE\"", DecisionMakerRole.class));
        assertEquals(DecisionMakerRole.EVALUATOR, objectMapper.readValue("\"\"", DecisionMakerRole.class));
    }
}
