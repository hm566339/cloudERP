package com.erp.auth_service.service;

import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.utility.AccessMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthorizationServiceTest {
    private final AuthorizationService authorizationService = new AuthorizationService();

    @AfterEach
    void clearContext() {
        RequestContext.clear();
    }

    @Test
    void readOnlyAllowsReadsButRejectsWrites() {
        RequestContext.set(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, AccessMode.READ_ONLY);

        assertDoesNotThrow(authorizationService::requireReadAccess);
        assertThrows(ForbiddenException.class, authorizationService::requireWriteAccess);
    }

    @Test
    void fullAccessAllowsWrites() {
        RequestContext.set(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, AccessMode.FULL);

        assertDoesNotThrow(authorizationService::requireWriteAccess);
    }

    @Test
    void blockedAccessRejectsReadsAndWrites() {
        RequestContext.set(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, AccessMode.BLOCKED);

        assertThrows(ForbiddenException.class, authorizationService::requireReadAccess);
        assertThrows(ForbiddenException.class, authorizationService::requireWriteAccess);
    }
}
