package com.erp.crm.modules.account.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.account.dto.request.ContactCreateRequest;
import com.erp.crm.modules.account.dto.response.ContactResponse;
import com.erp.crm.modules.account.enums.DecisionMakerRole;
import com.erp.crm.modules.account.service.CrmContactService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmContactControllerTest {

    @Mock
    private CrmContactService contactService;

    @InjectMocks
    private CrmContactController contactController;

    @Test
    @DisplayName("updateContact handles PUT/PATCH/POST update request successfully")
    void testUpdateContact() {
        UUID contactId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        ContactCreateRequest requestData = new ContactCreateRequest();
        requestData.setFirstName("Test");
        requestData.setLastName("User");
        requestData.setDecisionMakerRole(DecisionMakerRole.ECONOMIC_BUYER);

        ApiRequest<ContactCreateRequest> apiRequest = new ApiRequest<>();
        apiRequest.setData(requestData);

        ContactResponse mockResponse = ContactResponse.builder()
                .id(contactId)
                .firstName("Test")
                .lastName("User")
                .decisionMakerRole(DecisionMakerRole.ECONOMIC_BUYER)
                .build();

        when(contactService.updateContact(eq(contactId), any(ContactCreateRequest.class), eq(companyId)))
                .thenReturn(mockResponse);

        ResponseEntity<ApiResponse<ContactResponse>> response = contactController.updateContact(
                contactId, apiRequest, companyId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Contact updated successfully", response.getBody().getMessage());
        assertEquals(contactId, response.getBody().getData().getId());
        assertEquals(DecisionMakerRole.ECONOMIC_BUYER, response.getBody().getData().getDecisionMakerRole());

        verify(contactService, times(1)).updateContact(eq(contactId), any(ContactCreateRequest.class), eq(companyId));
    }

    @Test
    @DisplayName("deleteContact removes contact successfully")
    void testDeleteContact() {
        UUID contactId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        doNothing().when(contactService).deleteContact(eq(contactId), eq(companyId));

        ResponseEntity<ApiResponse<Void>> response = contactController.deleteContact(contactId, companyId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Contact deleted successfully", response.getBody().getMessage());

        verify(contactService, times(1)).deleteContact(eq(contactId), eq(companyId));
    }
}
