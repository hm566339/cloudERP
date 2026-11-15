package com.erp.crm.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI salesCrmOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Mark2 Cloud ERP - Sales & CRM Microservice")
                        .description("Comprehensive REST API for Enterprise Sales & CRM, Lead Ingestion, Pipeline & Opportunity Management, Quotations with Workflow Approvals, and Omnichannel Communications.")
                        .version("1.0.0")
                        .contact(new Contact().name("Mark2 Development Team").email("dev@mark2.in")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}

