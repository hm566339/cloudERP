package com.erp.account.modules.salesinvoice.mapper;

import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class SalesInvoiceMapperTest {

    private final SalesInvoiceMapper mapper = Mappers.getMapper(SalesInvoiceMapper.class);

    @Test
    public void testEntityToResponse_MappingNewFields() {
        // Given
        SalesInvoice entity = new SalesInvoice();
        
        UUID posId = UUID.randomUUID();
        entity.setPlaceOfSupplyStateId(posId);
        entity.setPlaceOfSupplyStateCode("10");

        UUID addressId = UUID.randomUUID();
        entity.setDeliveryAddressId(addressId);
        entity.setDeliveryAddressLine1("Test Address");
        entity.setDeliveryCity("Patna");
        entity.setDeliveryState("Bihar");
        entity.setDeliveryCountry("India");
        entity.setDeliveryPostalCode("800001");

        // When
        SalesInvoiceResponse response = mapper.entityToResponse(entity);

        // Then
        assertNotNull(response);
        assertEquals(posId, response.getPlaceOfSupplyStateId());
        assertEquals("10", response.getPlaceOfSupplyStateCode());

        assertEquals(addressId, response.getDeliveryAddressId());
        assertEquals("Test Address", response.getDeliveryAddressLine1());
        assertEquals("Patna", response.getDeliveryCity());
        assertEquals("Bihar", response.getDeliveryState());
        assertEquals("India", response.getDeliveryCountry());
        assertEquals("800001", response.getDeliveryPostalCode());
    }

    @Test
    public void testCustomerStateAndPlaceOfSupplyMismatch() {
        // Given
        SalesInvoice entity = new SalesInvoice();
        
        // Customer state mapping (e.g. Haryana)
        entity.setBillingState("HARYANA");
        entity.setBillingStateCode("06");

        // Place of supply mapping (e.g. Bihar)
        UUID posId = UUID.randomUUID();
        entity.setPlaceOfSupplyStateId(posId);
        entity.setPlaceOfSupplyStateCode("10");

        // When
        SalesInvoiceResponse response = mapper.entityToResponse(entity);
        
        // Custom logic in Service will populate placeOfSupply name, but we only test mapper here

        // Then
        // Verify customer state code is mapped from billing
        assertEquals("06", response.getCustomerStateCode(), "Customer state code should be mapped from billingStateCode");
        assertEquals("HARYANA", response.getCustomerState(), "Customer state should be mapped from billingState");
        
        // Verify place of supply state code is independent
        assertEquals("10", response.getPlaceOfSupplyStateCode(), "Place of supply state code should not be overwritten");
        assertEquals(posId, response.getPlaceOfSupplyStateId());
    }
}
