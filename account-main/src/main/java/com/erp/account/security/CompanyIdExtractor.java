package com.erp.account.security;

import java.io.InputStream;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.Collection;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.MediaType;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

public final class CompanyIdExtractor {

    private static final Logger log = LoggerFactory.getLogger(CompanyIdExtractor.class);

    private static final Set<String> COMPANY_ID_FIELD_NAMES = Set.of(
            "companyId",
            "companyID",
            "company_id",
            "id",
            "tenantId",
            "tenantID",
            "tenant_id");

    private static final Set<Class<?>> IGNORED_TYPES = Set.of(
            HttpServletRequest.class,
            HttpServletResponse.class,
            ServletRequest.class,
            ServletResponse.class,
            MultipartFile.class,
            InputStream.class,
            OutputStream.class,
            java.io.Reader.class,
            java.io.Writer.class,
            org.springframework.http.HttpHeaders.class,
            MediaType.class);

    private static final Pattern JDK_PACKAGE_PATTERN = Pattern
            .compile("^(java|javax|jakarta|com\\.sun|sun|oracle)\\..*");

    private static final Map<Class<?>, Field[]> FIELD_CACHE = new ConcurrentHashMap<>();

    private CompanyIdExtractor() {
        throw new IllegalStateException("Utility class");
    }

    public record FoundCompanyId(String source, String fieldPath, Object companyId) {
    }

    public static Optional<FoundCompanyId> extract(java.lang.reflect.Method method, Object[] args) {
        if (method == null || args == null) {
            return Optional.empty();
        }

        Parameter[] parameters = method.getParameters();
        for (int index = 0; index < args.length && index < parameters.length; index++) {
            Object argument = args[index];
            if (argument == null) {
                continue;
            }

            Parameter parameter = parameters[index];
            String source = determineSource(parameter);
            String basePath = resolveParameterName(parameter).orElse("arg" + index);
            Optional<FoundCompanyId> found = inspectArgument(argument, source, basePath, 0,
                    java.util.Collections.newSetFromMap(new IdentityHashMap<>()));
            if (found.isPresent()) {
                return found;
            }
        }

        return Optional.empty();
    }

    private static Optional<FoundCompanyId> inspectArgument(Object value,
            String rootSource,
            String path,
            int depth,
            Set<Object> visited) {
        if (value == null || visited.contains(value)) {
            return Optional.empty();
        }

        visited.add(value);
        Class<?> valueType = value.getClass();

        if (isSupportedIdentifierType(valueType) && isCompanyIdField(path)) {
            return Optional.of(new FoundCompanyId(resolveSource(rootSource, depth), path, value));
        }

        if (isIgnoredType(valueType)) {
            return Optional.empty();
        }

        if (valueType.isArray()) {
            int length = Array.getLength(value);
            for (int i = 0; i < length; i++) {
                Object element = Array.get(value, i);
                Optional<FoundCompanyId> found = inspectArgument(element, rootSource, path + "[" + i + "]", depth + 1,
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
                Optional<FoundCompanyId> found = inspectArgument(element, rootSource, path + "[" + index + "]",
                        depth + 1, visited);
                if (found.isPresent()) {
                    return found;
                }
                index++;
            }
            return Optional.empty();
        }

        if (isSimpleJdkType(valueType)) {
            return Optional.empty();
        }

        return inspectFields(value, rootSource, path, depth, visited);
    }

    private static Optional<FoundCompanyId> inspectFields(Object value,
            String rootSource,
            String path,
            int depth,
            Set<Object> visited) {
        for (Field field : getCachedFields(value.getClass())) {
            Object fieldValue = readField(field, value);
            if (fieldValue == null) {
                continue;
            }
            String fieldPath = path + "." + field.getName();
            Optional<FoundCompanyId> found = inspectArgument(fieldValue, rootSource, fieldPath, depth + 1, visited);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private static Field[] getCachedFields(Class<?> type) {
        return FIELD_CACHE.computeIfAbsent(type, CompanyIdExtractor::discoverFields);
    }

    private static Field[] discoverFields(Class<?> type) {
        Map<String, Field> fields = new HashMap<>();
        Class<?> current = type;
        while (current != null && !Object.class.equals(current)) {
            for (Field field : current.getDeclaredFields()) {
                if (Modifier.isStatic(field.getModifiers()) || field.isSynthetic()) {
                    continue;
                }
                if (IGNORED_TYPES.contains(field.getType())) {
                    continue;
                }
                try {
                    field.setAccessible(true);
                } catch (Exception ex) {
                    log.debug("Unable to make field accessible: {}", field, ex);
                }
                fields.putIfAbsent(field.getName(), field);
            }
            current = current.getSuperclass();
        }
        return fields.values().toArray(Field[]::new);
    }

    private static Optional<String> resolveParameterName(Parameter parameter) {
        Optional<String> requestParamName = resolveAnnotationName(parameter, RequestParam.class);
        if (requestParamName.isPresent()) {
            return requestParamName;
        }
        Optional<String> pathVariableName = resolveAnnotationName(parameter, PathVariable.class);
        if (pathVariableName.isPresent()) {
            return pathVariableName;
        }
        return Optional.ofNullable(parameter.getName()).filter(name -> !name.isBlank());
    }

    private static String determineSource(Parameter parameter) {
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

    private static <T extends Annotation> Optional<String> resolveAnnotationName(Parameter parameter,
            Class<T> annotationType) {
        T annotation = parameter.getAnnotation(annotationType);
        if (annotation == null) {
            return Optional.empty();
        }

        if (annotation instanceof RequestParam requestParam) {
            if (!requestParam.name().isBlank()) {
                return Optional.of(requestParam.name());
            }
            if (!requestParam.value().isBlank()) {
                return Optional.of(requestParam.value());
            }
        }

        if (annotation instanceof PathVariable pathVariable) {
            if (!pathVariable.name().isBlank()) {
                return Optional.of(pathVariable.name());
            }
            if (!pathVariable.value().isBlank()) {
                return Optional.of(pathVariable.value());
            }
        }

        return Optional.empty();
    }

    private static boolean isCompanyIdField(String path) {
        if (path == null || path.isBlank()) {
            return false;
        }

        int lastDot = path.lastIndexOf('.');
        String name = lastDot == -1 ? path : path.substring(lastDot + 1);
        int bracket = name.indexOf('[');
        if (bracket != -1) {
            name = name.substring(0, bracket);
        }
        return COMPANY_ID_FIELD_NAMES.contains(name);
    }

    private static String resolveSource(String rootSource, int depth) {
        if ("RequestParam".equals(rootSource) || "PathVariable".equals(rootSource)) {
            return rootSource;
        }
        if (depth == 0) {
            return "DTO";
        }
        return "NestedDTO";
    }

    private static boolean isSupportedIdentifierType(Class<?> type) {
        return UUID.class.isAssignableFrom(type)
                || CharSequence.class.isAssignableFrom(type)
                || Long.class.equals(type)
                || long.class.equals(type);
    }

    private static boolean isIgnoredType(Class<?> type) {
        return type == null || IGNORED_TYPES.contains(type) || ClassUtils.isPrimitiveOrWrapper(type) || type.isEnum();
    }

    private static boolean isSimpleJdkType(Class<?> type) {
        if (isSupportedIdentifierType(type)) {
            return false;
        }
        Package pkg = type.getPackage();
        return pkg != null && JDK_PACKAGE_PATTERN.matcher(pkg.getName()).matches();
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
