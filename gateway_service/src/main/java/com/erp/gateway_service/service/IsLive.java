package com.erp.gateway_service.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service

public class IsLive {

    @Scheduled(fixedRate = 150000)
    public void check() {
        System.out.println("Service is live");
    }

}
