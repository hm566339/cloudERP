package com.erp.auth_service.utility;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Service
@Slf4j
public class IsLive {

    @Scheduled(fixedRate = 150000)
    public void check() {
        log.info("Service is live");
    }

}
