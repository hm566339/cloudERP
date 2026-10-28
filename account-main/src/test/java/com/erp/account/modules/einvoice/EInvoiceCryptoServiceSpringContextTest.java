package com.erp.account.modules.einvoice;

import com.erp.account.modules.einvoice.service.EInvoiceCryptoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validates that Spring Dependency Injection container successfully discovers,
 * resolves constructor injection via @Autowired, and instantiates EInvoiceCryptoService
 * without requiring a default no-argument constructor.
 */
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {EInvoiceCryptoService.class})
@TestPropertySource(properties = {
        "erp.einvoice.security.master-key=SpringContainerTestKey2026AES32B"
})
class EInvoiceCryptoServiceSpringContextTest {

    @Autowired
    private EInvoiceCryptoService cryptoService;

    @Test
    @DisplayName("Spring ApplicationContext instantiates EInvoiceCryptoService bean via @Autowired constructor")
    void testSpringBeanInstantiation_ViaAutowiredConstructor() {
        assertNotNull(cryptoService, "EInvoiceCryptoService bean must be instantiated and injected by Spring context");
        assertTrue(cryptoService.isMasterKeyConfigured(), "Master key injected from @TestPropertySource must be active");
    }
}
