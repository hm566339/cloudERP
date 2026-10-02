package com.erp.auth_service.service;

import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.utility.AccessMode;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {
    public void requireReadAccess() {
        RequestContext.Context context = requireContext();
        if (context.accessMode() == AccessMode.BLOCKED) {
            throw new ForbiddenException("Organization access is blocked");
        }
    }

    public void requireWriteAccess() {
        RequestContext.Context context = RequestContext.get();
        if (context == null) {
            return;
        }
        if (context.accessMode() != AccessMode.FULL) {
            throw new ForbiddenException("Organization is read-only");
        }
    }

    private RequestContext.Context requireContext() {
        RequestContext.Context context = RequestContext.get();
        if (context == null) {
            throw new ForbiddenException("Request context is unavailable");
        }
        return context;
    }
}