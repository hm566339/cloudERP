package com.erp.account.common.config;

import org.springframework.context.annotation.Bean;
import feign.Logger;

public class FeignClientConfig {

    @Bean
    public FeignAuthInterceptor feignAuthInterceptor() {
        return new FeignAuthInterceptor();
    }

    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}
