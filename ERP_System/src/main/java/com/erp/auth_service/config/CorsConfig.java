// package com.erp.auth_service.config;

// import com.erp.auth_service.repository.ModuleRepository;
// import jakarta.servlet.http.HttpServletRequest;
// import lombok.RequiredArgsConstructor;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;

// import java.net.URI;
// import java.util.Arrays;
// import java.util.List;
// import java.util.stream.Collectors;

// @Configuration
// @RequiredArgsConstructor
// public class CorsConfig {

//     @Value("${api.frontend}")
//     private String frontendUrl;

//     private final ModuleRepository moduleRepository;

//     @Bean
//     public CorsConfigurationSource corsConfigurationSource() {
//         return request -> buildCorsConfiguration(request);
//     }

//     private CorsConfiguration buildCorsConfiguration(HttpServletRequest request) {
//         String requestOrigin = request.getHeader("Origin");

//         CorsConfiguration config = new CorsConfiguration();
//         config.setAllowCredentials(true);
//         config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
//         config.setAllowedHeaders(List.of("*"));
//         config.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie"));

//         List<String> staticOrigins = List.of(frontendUrl);

//         List<String> dbOrigins = moduleRepository.findAllActiveHosts()
//                 .stream()
//                 .map(this::extractOrigin)
//                 .filter(origin -> origin != null && !origin.isBlank())
//                 .distinct()
//                 .collect(Collectors.toList());

//         List<String> allowedOrigins = new java.util.ArrayList<>(staticOrigins);
//         allowedOrigins.addAll(dbOrigins);

//         if (requestOrigin != null && allowedOrigins.contains(requestOrigin)) {
//             config.setAllowedOrigins(List.of(requestOrigin));
//         }

//         return config;
//     }

//     private String extractOrigin(String url) {
//         try {
//             URI uri = URI.create(url);
//             String scheme = uri.getScheme();
//             String host = uri.getHost();
//             int port = uri.getPort();

//             if (scheme == null || host == null) {
//                 return null;
//             }

//             return port == -1
//                     ? scheme + "://" + host
//                     : scheme + "://" + host + ":" + port;
//         } catch (Exception e) {
//             return null;
//         }
//     }
// }