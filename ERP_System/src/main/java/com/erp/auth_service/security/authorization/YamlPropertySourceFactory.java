package com.erp.auth_service.security.authorization;

import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.core.io.support.PropertySourceFactory;

import java.io.IOException;
import java.util.List;

public class YamlPropertySourceFactory implements PropertySourceFactory {

    @Override
    public PropertySource<?> createPropertySource(String name, EncodedResource resource) throws IOException {
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        List<PropertySource<?>> sources = loader.load(
                resource.getResource().getFilename() != null ? resource.getResource().getFilename() : "authorization.yml",
                resource.getResource()
        );
        if (sources.isEmpty()) {
            throw new IOException("Failed to load YAML from " + resource.getResource().getFilename());
        }
        return sources.get(0);
    }
}
