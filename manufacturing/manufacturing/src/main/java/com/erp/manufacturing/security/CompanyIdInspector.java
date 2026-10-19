package com.erp.manufacturing.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

public final class CompanyIdInspector {

    private static final Logger log = LoggerFactory.getLogger(CompanyIdInspector.class);

    private static final Set<String> COMPANY_ID_FIELD_NAMES = Set.of(
            "companyId", "companyID", "company_id", "companycode", "companyCode",
            "tenantId", "tenantID", "tenant_id");

    private static final Pattern JDK_PACKAGE_PATTERN = Pattern
            .compile("^(java|javax|jakarta|com\\.sun|sun|oracle)\\..*");

    private static final Map<Class<?>, Field[]> fieldCache = new ConcurrentHashMap<>();

    private CompanyIdInspector() {
        throw new IllegalStateException("Utility class");
    }

    public static Optional<Object> inspect(Object target) {
        if (target == null) {
            return Optional.empty();
        }
        Set<Object> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        return inspectInternal(target, visited, 0);
    }

    private static Optional<Object> inspectInternal(Object target, Set<Object> visited, int depth) {
        if (target == null || depth > 5 || !visited.add(target)) {
            return Optional.empty();
        }

        Class<?> clazz = target.getClass();
        if (clazz.isPrimitive() || clazz.getName().startsWith("java.lang.")) {
            return Optional.empty();
        }

        if (target instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getKey() != null && COMPANY_ID_FIELD_NAMES.contains(entry.getKey().toString())) {
                    if (entry.getValue() != null) {
                        return Optional.of(entry.getValue());
                    }
                }
            }
            return Optional.empty();
        }

        Field[] fields = fieldCache.computeIfAbsent(clazz, c -> c.getDeclaredFields());
        for (Field field : fields) {
            if (COMPANY_ID_FIELD_NAMES.contains(field.getName())) {
                try {
                    field.setAccessible(true);
                    Object val = field.get(target);
                    if (val != null) {
                        return Optional.of(val);
                    }
                } catch (Exception e) {
                    log.debug("Could not read field {}: {}", field.getName(), e.getMessage());
                }
            }
        }

        return Optional.empty();
    }
}
