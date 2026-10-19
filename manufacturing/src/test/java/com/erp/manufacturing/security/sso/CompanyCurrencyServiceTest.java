package com.erp.manufacturing.security.sso;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.security.dto.sso.CompanyResponse;
import com.erp.manufacturing.security.dto.sso.ResponseWrapper;
import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;
import com.erp.manufacturing.util.CurrentUserContext;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyCurrencyServiceTest {

    private FakeSsoFeignClient ssoFeignClient;
    private CompanyCurrencyServiceImpl currencyService;

    @BeforeEach
    void setUp() {
        ssoFeignClient = new FakeSsoFeignClient();
        currencyService = new CompanyCurrencyServiceImpl(ssoFeignClient);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    static class FakeSsoFeignClient implements SsoFeignClient {
        ResponseWrapper<CompanyResponse> companyResponse;
        RuntimeException exceptionToThrow;
        int callCount = 0;
        UUID lastId;
        String lastToken;

        @Override
        public ResponseWrapper<TokenVerifyResponse> verifyToken(String token) {
            return null;
        }

        @Override
        public ResponseWrapper<CompanyResponse> verifyCompany(UUID id, String companyCode, String token) {
            callCount++;
            lastId = id;
            lastToken = token;
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
            return companyResponse;
        }
    }

    @Test
    void inrConfiguredCompany_returnsINR() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        ssoFeignClient.companyResponse = ResponseWrapper.success(CompanyResponse.builder()
                .id(companyId)
                .companyCode("CMP-INR")
                .companyName("India Company")
                .baseCurrency("INR")
                .build());

        String currency = currencyService.getCompanyCurrency(companyId);

        assertEquals("INR", currency);
        assertEquals(1, ssoFeignClient.callCount);
        assertEquals(companyId, ssoFeignClient.lastId);
    }

    @Test
    void usdConfiguredCompany_returnsUSD() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        ssoFeignClient.companyResponse = ResponseWrapper.success(CompanyResponse.builder()
                .id(companyId)
                .companyCode("CMP-USD")
                .companyName("US Company")
                .baseCurrency("USD")
                .build());

        String currency = currencyService.getCompanyCurrency(companyId);

        assertEquals("USD", currency);
        assertEquals(1, ssoFeignClient.callCount);
        assertEquals(companyId, ssoFeignClient.lastId);
    }

    @Test
    void missingCurrencyConfiguration_throwsException() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        ssoFeignClient.companyResponse = ResponseWrapper.success(CompanyResponse.builder()
                .id(companyId)
                .companyCode("CMP-NOCURR")
                .companyName("No Currency Company")
                .baseCurrency(null)
                .build());

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> currencyService.getCompanyCurrency(companyId));

        assertTrue(ex.getMessage().contains("Company currency is not configured in SSO"));
    }

    @Test
    void invalidCompanyId_nullCompanyId_throwsException() {
        assertThrows(BusinessValidationException.class, () -> currencyService.getCompanyCurrency(null));
    }

    @Test
    void invalidCompanyId_ssoReturnsFailureResponse_throwsException() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        ssoFeignClient.companyResponse = ResponseWrapper.<CompanyResponse>builder()
                .success(false)
                .message("Company not found")
                .data(null)
                .build();

        ExternalServiceException ex = assertThrows(ExternalServiceException.class,
                () -> currencyService.getCompanyCurrency(companyId));

        assertTrue(ex.getMessage().contains("Failed to verify company from SSO"));
    }

    @Test
    void ssoApiFailure_throwsExternalServiceException() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        Request request = Request.create(Request.HttpMethod.GET, "/api/sso/company/company-verify",
                Collections.emptyMap(), null, new RequestTemplate());
        ssoFeignClient.exceptionToThrow = new FeignException.InternalServerError("SSO service 500 error", request, null, Collections.emptyMap());

        ExternalServiceException ex = assertThrows(ExternalServiceException.class,
                () -> currencyService.getCompanyCurrency(companyId));

        assertTrue(ex.getMessage().contains("SSO company verification failed"));
    }

    @Test
    void multiTenantIsolation_preventCrossCompanyDataAccess() {
        UUID tenantA = UUID.randomUUID();
        UUID tenantB = UUID.randomUUID();
        CurrentUserContext.setCompanyId(tenantA);

        BusinessValidationException ex =
                assertThrows(BusinessValidationException.class,
                        () -> currencyService.getCompanyCurrency(tenantB));

        assertTrue(ex.getMessage().contains("Cross-tenant access prohibited"));
        assertEquals(0, ssoFeignClient.callCount);
    }

    @Test
    void caching_returnsCachedCurrencyWithoutDuplicateSsoCalls() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        ssoFeignClient.companyResponse = ResponseWrapper.success(CompanyResponse.builder()
                .id(companyId)
                .baseCurrency("EUR")
                .build());

        String firstCall = currencyService.getCompanyCurrency(companyId);
        String secondCall = currencyService.getCompanyCurrency(companyId);

        assertEquals("EUR", firstCall);
        assertEquals("EUR", secondCall);
        assertEquals(1, ssoFeignClient.callCount);
    }

    @Test
    void caseNormalization_convertsToLowerOrWhitespaceToUppercaseIsoCode() {
        UUID companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        ssoFeignClient.companyResponse = ResponseWrapper.success(CompanyResponse.builder()
                .id(companyId)
                .baseCurrency(" inr ")
                .build());

        String currency = currencyService.getCompanyCurrency(companyId);

        assertEquals("INR", currency);
    }
}
