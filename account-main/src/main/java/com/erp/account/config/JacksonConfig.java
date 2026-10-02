package com.erp.account.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.io.IOException;

@Configuration
public class JacksonConfig {

    @Bean
    public SimpleModule customSpringDataPageJacksonModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(Page.class, new PageSerializer());
        module.addSerializer(PageImpl.class, new PageSerializer());
        return module;
    }

    @SuppressWarnings("rawtypes")
    public static class PageSerializer extends JsonSerializer<Page> {
        @Override
        public void serialize(Page page, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
            jsonGenerator.writeStartObject();
            jsonGenerator.writeObjectField("content", page.getContent());
            jsonGenerator.writeObjectField("pageable", page.getPageable());
            jsonGenerator.writeNumberField("totalPages", page.getTotalPages());
            jsonGenerator.writeNumberField("totalElements", page.getTotalElements());
            jsonGenerator.writeBooleanField("last", page.isLast());
            jsonGenerator.writeNumberField("size", page.getSize());
            jsonGenerator.writeNumberField("number", page.getNumber());
            jsonGenerator.writeBooleanField("first", page.isFirst());
            jsonGenerator.writeNumberField("numberOfElements", page.getNumberOfElements());
            jsonGenerator.writeBooleanField("empty", page.isEmpty());
            jsonGenerator.writeEndObject();
        }
    }
}
