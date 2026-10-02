package com.erp.auth_service.dto.response;

public interface PortalAccessCountProjection {
    String getModuleName();
    Long getGrantedUsers();
}