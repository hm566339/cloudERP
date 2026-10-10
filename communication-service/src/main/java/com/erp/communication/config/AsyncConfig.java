package com.erp.communication.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class AsyncConfig {

    @org.springframework.context.annotation.Primary
    @Bean(name = "communicationTaskExecutor")
    public Executor communicationTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(15);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("CommAsync-");
        executor.initialize();
        return executor;
    }
}
