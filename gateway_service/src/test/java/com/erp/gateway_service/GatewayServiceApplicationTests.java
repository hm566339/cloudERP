package com.erp.gateway_service;

import com.erp.gateway_service.service.RouteProviderService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Collections;

import static org.mockito.Mockito.when;

@SpringBootTest
class GatewayServiceApplicationTests {

    @MockitoBean
    private RouteProviderService routeProviderService;

    @Test
    void contextLoads() {
        when(routeProviderService.getRoutes()).thenReturn(Collections.emptyList());
    }

}
