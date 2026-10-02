package com.erp.account.modules.auth.dto.ssoresponse;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Locks the JSON contract of the SSO token verify response so feature streams and
 * permission streams (featureCode, action, permissionCode, moduleName, active, allowed)
 * are parsed reliably and unknown SSO fields are tolerated.
 */
class SsoVerifyResponseJsonContractTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Parses feature objects and active+allowed permissions from the SSO response")
    void parsesFeaturesAndPermissions() throws Exception {
        String json = """
                {
                  "success": true,
                  "data": {
                    "valid": true,
                    "user": {
                      "id": "c2c7e9f2-6c5a-4b0a-9c1d-1a2b3c4d5e6f",
                      "username": "johndoe",
                      "companyCode": "ACME",
                      "accountStatus": "ACTIVE",
                      "roles": [ { "id": 1, "name": "FINANCE_MANAGER", "status": true, "someFutureField": "ignored" } ],
                      "features": [
                        { "featureCode": "PAYMENTS",      "featureName": "Payments",          "moduleName": "AP_PAYMENTS", "source": "role" },
                        { "featureCode": "CUSTOMER_MGMT", "featureName": "Customer Mgmt",     "moduleName": "CUSTOMERS",   "source": "permission" }
                      ],
                      "permissions": [
                        { "featureCode": "CUSTOMER_MGMT", "action": "READ",  "permissionCode": "CUSTOMER_MGMT:READ",  "moduleName": "CUSTOMERS", "active": true,  "allowed": true,  "source": "role" },
                        { "featureCode": "PAYMENTS",       "action": "WRITE", "permissionCode": "PAYMENTS:WRITE",      "moduleName": "AP_PAYMENTS", "active": true,  "allowed": true,  "source": "role" },
                        { "featureCode": "REPORTS",         "action": "READ",  "permissionCode": "REPORTS:READ",       "moduleName": "REPORTS",  "active": false, "allowed": true,  "source": "role" },
                        { "featureCode": "PAYMENTS",        "action": "DELETE","permissionCode": "PAYMENTS:DELETE",     "moduleName": "AP_PAYMENTS", "active": true,  "allowed": false, "source": "role" },
                        { "action": "READ", "moduleName": "CUSTOMERS", "active": true, "allowed": true, "futureField": "ok" }
                      ]
                    }
                  }
                }
                """;

        ResponseWrapper<TokenVerifyResponse> wrapper =
                objectMapper.readValue(json, new TypeReference<>() {
                });

        TokenVerifyResponse verify = wrapper.getData();
        assertThat(verify.isValid()).isTrue();

        UserResponse user = verify.getUser();
        assertThat(user.getId()).isNotNull();
        assertThat(user.getUsername()).isEqualTo("johndoe");
        assertThat(user.getCompanyCode()).isEqualTo("ACME");
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(user.getFeatures()).extracting("featureCode").containsExactly("PAYMENTS", "CUSTOMER_MGMT");
        assertThat(user.getFeatures().get(0).getModuleName()).isEqualTo("AP_PAYMENTS");
        assertThat(user.getPermissions()).hasSize(5);

        PermissionResponse first = user.getPermissions().get(0);
        assertThat(first.getFeatureCode()).isEqualTo("CUSTOMER_MGMT");
        assertThat(first.getAction()).isEqualTo("READ");
        assertThat(first.getPermissionCode()).isEqualTo("CUSTOMER_MGMT:READ");
        assertThat(first.getModuleName()).isEqualTo("CUSTOMERS");
        assertThat(first.getActive()).isTrue();
        assertThat(first.getAllowed()).isTrue();
        assertThat(first.getSource()).isEqualTo("role");

        assertThat(user.getPermissions().get(2).getActive()).isFalse();
        assertThat(user.getPermissions().get(3).getAllowed()).isFalse();
        assertThat(user.getPermissions().get(4).getFeatureCode()).isNull();
    }

    @Test
    @DisplayName("Unknown and future SSO fields never break deserialization")
    void unknownFieldsTolerated() throws Exception {
        String json = """
                {
                  "success": true,
                  "data": {
                    "valid": true,
                    "user": {
                      "id": "c2c7e9f2-6c5a-4b0a-9c1d-1a2b3c4d5e6f",
                      "username": "johndoe",
                      "companyCode": "ACME",
                      "accountStatus": "ACTIVE",
                      "roles": [ { "name": "SYSTEM_ADMIN", "status": true } ],
                      "features": [ { "featureCode": "PAYMENTS", "featureName": "Payments", "moduleName": "AP_PAYMENTS" } ],
                      "permissions": [
                        { "featureCode": "PAYMENTS", "action": "READ", "moduleName": "AP_PAYMENTS", "active": true, "allowed": true, "source": "role" }
                      ],
                      "someBrandNewClaim": [ "x", "y" ],
                      "extra": { "nested": true }
                    }
                  }
                }
                """;

        ResponseWrapper<TokenVerifyResponse> wrapper =
                objectMapper.readValue(json, new TypeReference<>() {
                });

        assertThat(wrapper.getData().getUser().getPermissions()).hasSize(1);
        assertThat(wrapper.getData().getUser().getFeatures())
                .extracting("featureCode")
                .containsExactly("PAYMENTS");
    }
}