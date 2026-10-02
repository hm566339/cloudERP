// package com.erp.account.audit;

// import com.fasterxml.jackson.databind.ObjectMapper;
// import org.junit.jupiter.api.BeforeEach;
// import org.springframework.beans.factory.annotation.Autowired;
// import
// org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.test.context.ActiveProfiles;
// import org.springframework.test.context.DynamicPropertyRegistry;
// import org.springframework.test.context.DynamicPropertySource;
// import org.springframework.test.web.servlet.MockMvc;
// import org.testcontainers.containers.PostgreSQLContainer;
// import org.testcontainers.junit.jupiter.Container;
// import org.testcontainers.junit.jupiter.Testcontainers;
// import com.erp.account.security.CurrentUserContext;

// import java.util.UUID;

// @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
// @AutoConfigureMockMvc
// @Testcontainers
// @ActiveProfiles("test")
// public abstract class BaseAuditIntegrationTest {

// @Container
// static PostgreSQLContainer<?> postgres = new
// PostgreSQLContainer<>("postgres:15-alpine")
// .withDatabaseName("erp_test")
// .withUsername("postgres")
// .withPassword("password");

// @DynamicPropertySource
// static void configureProperties(DynamicPropertyRegistry registry) {
// registry.add("spring.datasource.url", postgres::getJdbcUrl);
// registry.add("spring.datasource.username", postgres::getUsername);
// registry.add("spring.datasource.password", postgres::getPassword);
// }

// @Autowired
// protected MockMvc mockMvc;

// @Autowired
// protected ObjectMapper objectMapper;

// protected static final UUID MOHIT_ID =
// UUID.fromString("11111111-1111-1111-1111-111111111111");
// protected static final String MOHIT_USERNAME = "Mohit950";

// protected static final UUID RAHUL_ID =
// UUID.fromString("22222222-2222-2222-2222-222222222222");
// protected static final String RAHUL_USERNAME = "Rahul123";

// protected static final UUID COMPANY_ID =
// UUID.fromString("99999999-9999-9999-9999-999999999999");

// @BeforeEach
// void setupContext() {
// CurrentUserContext.clear();
// }

// protected void loginAsMohit() {
// CurrentUserContext.setUserId(MOHIT_ID);
// CurrentUserContext.setUsername(MOHIT_USERNAME);
// CurrentUserContext.setCompanyId(COMPANY_ID);
// // Note: For real MockMvc tests we might also need to mock
// SecurityContextHolder if the controllers use it.
// // Or we inject a mock JWT into the request header. Let's provide a mock
// token interceptor or just setup SecurityContext.
// }

// protected void loginAsRahul() {
// CurrentUserContext.setUserId(RAHUL_ID);
// CurrentUserContext.setUsername(RAHUL_USERNAME);
// CurrentUserContext.setCompanyId(COMPANY_ID);
// }

// protected void logout() {
// CurrentUserContext.clear();
// }
// }
