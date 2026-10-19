package com.erp.manufacturing.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public final class CompanyIdExtractor {

    private static final Logger log = LoggerFactory.getLogger(CompanyIdExtractor.class);

    // Explicitly exclude generic "id" so BOM ID and Production Order ID are never mistaken for Company ID
    private static final Set<String> COMPANY_ID_FIELD_NAMES = Set.of(
            "companyId",
            "companyID",
            "company_id",
            "companyCode",
            "companycode",
            "tenantId",
            "tenantID",
            "tenant_id");

    private static final Map<Class<?>, Field[]> FIELD_CACHE = new ConcurrentHashMap<>();

    private CompanyIdExtractor() {
        throw new IllegalStateException("Utility class");
    }

    public record FoundCompanyId(String source, String fieldPath, Object companyId) {
    }

    public static Optional<FoundCompanyId> extract(Method method, Object[] args) {
        if (method == null || args == null) {
            return Optional.empty();
        }

        Parameter[] parameters = method.getParameters();
        for (int i = 0; i < args.length && i < parameters.length; i++) {
            Object arg = args[i];
            if (arg == null) continue;

            Parameter param = parameters[i];
            String source = determineSource(param);
            String paramName = param.getName();

            // Check if parameter itself is named companyId
            if (isCompanyIdField(paramName)) {
                return Optional.of(new FoundCompanyId(source, paramName, arg));
            }

            // Inspect object fields
            Optional<FoundCompanyId> found = inspectArgument(arg, source, paramName, 0,
                    Collections.newSetFromMap(new IdentityHashMap<>()));
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private static String determineSource(Parameter parameter) {
        if (parameter.isAnnotationPresent(RequestParam.class)) return "REQUEST_PARAM";
        if (parameter.isAnnotationPresent(PathVariable.class)) return "PATH_VARIABLE";
        if (parameter.isAnnotationPresent(RequestBody.class)) return "REQUEST_BODY";
        return "METHOD_PARAM";
    }

    private static boolean isCompanyIdField(String name) {
        if (name == null) return false;
        String clean = name;
        int dot = clean.lastIndexOf('.');
        if (dot >= 0) {
            clean = clean.substring(dot + 1);
        }
        int bracket = clean.lastIndexOf('[');
        if (bracket >= 0) {
            clean = clean.substring(0, bracket);
        }
        return COMPANY_ID_FIELD_NAMES.contains(clean);
    }

    private static Optional<FoundCompanyId> inspectArgument(Object value, String source, String path, int depth, Set<Object> visited) {
        if (value == null || depth > 5 || !visited.add(value)) {
            return Optional.empty();
        }

        Class<?> clazz = value.getClass();
        if (clazz.isPrimitive() || clazz.getName().startsWith("java.lang.") || clazz.getName().startsWith("java.time.")) {
            return Optional.empty();
        }

        if (value instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getKey() != null && isCompanyIdField(entry.getKey().toString())) {
                    if (entry.getValue() != null) {
                        return Optional.of(new FoundCompanyId(source, path + "." + entry.getKey(), entry.getValue()));
                    }
                }
            }
            return Optional.empty();
        }

        Field[] fields = FIELD_CACHE.computeIfAbsent(clazz, Class::getDeclaredFields);
        for (Field f : fields) {
            if (isCompanyIdField(f.getName())) {
                try {
                    f.setAccessible(true);
                    Object val = f.get(value);
                    if (val != null) {
                        return Optional.of(new FoundCompanyId(source, path + "." + f.getName(), val));
                    }
                } catch (Exception ignored) {
                }
            }
        }

        return Optional.empty();
    }
}
