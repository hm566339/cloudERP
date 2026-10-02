package com.erp.account.security;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import io.netty.handler.codec.http.HttpHeaders;
import io.netty.handler.codec.http2.StreamByteDistributor.Writer;
import io.swagger.v3.oas.models.media.MediaType;

public final class CompanyIdInspector {

    private static final Logger log = LoggerFactory.getLogger(CompanyIdInspector.class);
    private static final Set<String> COMPANY_ID_FIELD_NAMES = Set.of(
            "companyId", "companyID", "company_id", "companycode", "companyCode",
            "tenantId", "tenantID", "tenant_id");
    private static final Pattern JDK_PACKAGE_PATTERN = Pattern
            .compile("^(java|javax|jakarta|com\\.sun|sun|oracle)\\..*");
    private static final Set<Class<?>> IGNORED_TYPES = Set.of(
            HttpServletRequest.class,
            ServletRequest.class,
            ServletResponse.class,
            HttpHeaders.class,
            MediaType.class,
            InputStream.class,
            OutputStream.class,
            Reader.class,
            Writer.class,
            MultipartFile.class);

    private static final Map<Class<?>, Field[]> fieldCache = new ConcurrentHashMap<>();

    private CompanyIdInspector() {
        throw new IllegalStateException("Utility class");
    }

    public record FoundCompanyId(String location, String fieldPath, Object companyId) {
    }

    public static Optional<FoundCompanyId> findCompanyId(Method method, Object[] args) {
        if (method == null || args == null) {
            return Optional.empty();
        }

        Parameter[] parameters = method.getParameters();

        for (int i = 0; i < args.length && i < parameters.length; i++) {
            Object argument = args[i];
            if (argument == null) {
                continue;
            }

            Parameter parameter = parameters[i];
            String location = determineLocation(parameter);
            String basePath = parameter.getName();
            if (basePath == null || basePath.isBlank()) {
                basePath = "arg" + i;
            }

            Optional<FoundCompanyId> found = inspectArgumentValue(argument, location, basePath, new HashSet<>());
            if (found.isPresent()) {
                return found;
            }
        }

        return Optional.empty();
    }

    private static String determineLocation(Parameter parameter) {
        if (parameter.isAnnotationPresent(RequestParam.class)) {
            return "RequestParam";
        }
        if (parameter.isAnnotationPresent(PathVariable.class)) {
            return "PathVariable";
        }
        if (parameter.isAnnotationPresent(RequestBody.class)) {
            return "RequestBody";
        }
        return "Argument";
    }

    private static Optional<FoundCompanyId> inspectArgumentValue(Object value, String location, String path,
            Set<Object> visited) {
        if (value == null || visited.contains(value)) {
            return Optional.empty();
        }

        visited.add(value);
        Class<?> valueType = value.getClass();

        if (isIgnoredType(valueType) || isJdkType(valueType)) {
            return Optional.empty();
        }

        if (matchesCompanyIdField(path) && isSimpleValue(valueType)) {
            return Optional.of(new FoundCompanyId(location, path, value));
        }

        if (valueType.isArray()) {
            int length = Array.getLength(value);
            for (int index = 0; index < length; index++) {
                Object element = Array.get(value, index);
                Optional<FoundCompanyId> found = inspectArgumentValue(element, location, path + "[" + index + "]",
                        visited);
                if (found.isPresent()) {
                    return found;
                }
            }
            return Optional.empty();
        }

        if (value instanceof Collection<?> collection) {
            int index = 0;
            for (Object element : collection) {
                Optional<FoundCompanyId> found = inspectArgumentValue(element, location, path + "[" + index + "]",
                        visited);
                if (found.isPresent()) {
                    return found;
                }
                index++;
            }
            return Optional.empty();
        }

        return inspectFields(value, location, path, visited);
    }

    private static Optional<FoundCompanyId> inspectFields(Object value, String location, String path,
            Set<Object> visited) {
        for (Field field : getCachedFields(value.getClass())) {
            Object fieldValue = readField(field, value);
            if (fieldValue == null) {
                continue;
            }
            Optional<FoundCompanyId> found = inspectArgumentValue(fieldValue, location, path + "." + field.getName(),
                    visited);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private static Field[] getCachedFields(Class<?> type) {
        return fieldCache.computeIfAbsent(type, CompanyIdInspector::discoverFields);
    }

    private static Field[] discoverFields(Class<?> type) {
        Map<String, Field> fields = new HashMap<>();
        while (type != null && !Object.class.equals(type)) {
            for (Field field : type.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers()) || field.isSynthetic()) {
                    continue;
                }
                if (IGNORED_TYPES.contains(field.getType())) {
                    continue;
                }
                field.setAccessible(true);
                fields.putIfAbsent(field.getName(), field);
            }
            type = type.getSuperclass();
        }
        return fields.values().toArray(new Field[0]);
    }

    private static boolean matchesCompanyIdField(String fieldName) {
        return fieldName != null && COMPANY_ID_FIELD_NAMES.contains(fieldName);
    }

    private static boolean isIgnoredType(Class<?> type) {
        return type == null || IGNORED_TYPES.contains(type) || ClassUtils.isPrimitiveOrWrapper(type) || type.isEnum();
    }

    private static boolean isJdkType(Class<?> type) {
        return type.getPackageName() != null && JDK_PACKAGE_PATTERN.matcher(type.getPackageName()).matches();
    }

    private static boolean isSimpleValue(Class<?> type) {
        return type.isPrimitive()
                || ClassUtils.isPrimitiveWrapper(type)
                || CharSequence.class.isAssignableFrom(type)
                || Number.class.isAssignableFrom(type)
                || java.time.temporal.Temporal.class.isAssignableFrom(type)
                || java.util.Date.class.isAssignableFrom(type);
    }

    private static Object readField(Field field, Object target) {
        try {
            return field.get(target);
        } catch (IllegalAccessException ex) {
            log.debug("Unable to read field {} on {}", field.getName(), target.getClass().getName(), ex);
            return null;
        }
    }
}
