package com.erp.workflow.security.authorization;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SsoAuthorizationPropertiesYamlTest {

    @Test
    @DisplayName("application-sso-auth.yml must be valid YAML with no duplicate keys")
    void testApplicationSsoAuthYmlIsValid() throws Exception {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<PropertySource<?>> sources = loader.load(
                "application-sso-auth.yml",
                new ClassPathResource("application-sso-auth.yml")
        );

        assertThat(sources).isNotEmpty();
        PropertySource<?> source = sources.get(0);
        assertThat(source.getSource()).isNotNull();
    }

    @Test
    @DisplayName("application.yml must be valid YAML with no duplicate keys")
    void testApplicationYmlIsValid() throws Exception {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<PropertySource<?>> sources = loader.load(
                "application.yml",
                new ClassPathResource("application.yml")
        );

        assertThat(sources).isNotEmpty();
    }

    @Test
    @DisplayName("SSO authorization properties bind correctly from application-sso-auth.yml")
    void testSsoAuthorizationPropertiesBinding() throws Exception {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<PropertySource<?>> sources = loader.load(
                "application-sso-auth.yml",
                new ClassPathResource("application-sso-auth.yml")
        );

        MutablePropertySources propertySources = new MutablePropertySources();
        sources.forEach(propertySources::addLast);

        Binder binder = new Binder(ConfigurationPropertySources.from(propertySources));
        SsoAuthorizationProperties props = binder.bind("sso.authorization", Bindable.of(SsoAuthorizationProperties.class))
                .orElse(null);

        assertThat(props).isNotNull();
        assertThat(props.getFeatureGroups()).containsKey("WORKFLOW_ADMIN");
        assertThat(props.getFeatureGroups()).containsKey("SYSTEM_ADMIN");
        assertThat(props.getFeatureGroups()).containsKey("WORKFLOW_DEFINITIONS");
        assertThat(props.getFeatureGroups().get("SYSTEM_ADMIN")).containsKey("WORKFLOW_DEFINITIONS");
        assertThat(props.getFeatureGroups().get("SYSTEM_ADMIN").get("WORKFLOW_DEFINITIONS"))
                .contains("ACTIVATE", "DEACTIVATE", "READ", "WRITE", "DELETE");
    }
}
