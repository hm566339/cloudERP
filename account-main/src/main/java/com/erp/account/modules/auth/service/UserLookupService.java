package com.erp.account.modules.auth.service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface UserLookupService {
    Map<UUID, String> resolveFullNames(Set<UUID> userIds);
}
