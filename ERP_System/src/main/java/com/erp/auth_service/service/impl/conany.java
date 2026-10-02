// package com.erp.auth_service.service.impl;

// import com.erp.auth_service.dto.request.CompanyRequest;
// import com.erp.auth_service.dto.request.StrapiCompanyRequest;
// import com.erp.auth_service.exception.DuplicateResourceException;
// import com.erp.auth_service.exception.ResourceNotFoundException;
// import com.erp.auth_service.exception.ServerConnectionFailedException;
// import com.erp.auth_service.model.Company;

// public class conany {

//      @Override
//         @Transactional
//         public Map<String, String> createCompany(CompanyRequest company, String token) {

//                 log.info("Creating company with code: {}", company.getCompanyCode());

//                 if (companyRepository.existsByCompanyName(company.getCompanyName())) {
//                         throw new DuplicateResourceException(
//                                         "Company name already exists");
//                 }

//                 log.info("token: {}", token);
//                 Module module = moduleRepository.findById(company.getModulesid())
//                                 .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

//                 String url = module.getHost() + "/companies";

//                 log.info("Sending request to Strapi server at URL: {}", url);
//                 Company createdCompany = companyMapper.toCompany(company);
//                 createdCompany.setCompanyCode(generateCompanyCode());

//                 Company savedCompany = companyRepository.save(createdCompany);
//                 StrapiCompanyRequest request = StrapiCompanyRequest.builder()
//                                 .data(
//                                                 StrapiCompanyRequest.CompanyData.builder()
//                                                                 .companyCode(savedCompany.getCompanyCode())
//                                                                 .companyName(savedCompany.getCompanyName())
//                                                                 .gstin(savedCompany.getGstin())
//                                                                 .baseCurrency(savedCompany.getBaseCurrency())
//                                                                 .email(savedCompany.getEmail())
//                                                                 .phone(savedCompany.getPhone())
//                                                                 .address(savedCompany.getAddressLine1() + " "
//                                                                                 + savedCompany.getAddressLine2())
//                                                                 .active(savedCompany.getActive())
//                                                                 .build())
//                                 .build();

//                 String realToken = token.startsWith("Bearer ")
//                                 ? token.substring(7)
//                                 : token;

//                 try {

//                         log.info("Sending request to Strapi server at URL: {}", url);

//                         String response = restClientBuilder.build()
//                                         .post()
//                                         .uri(url)
//                                         .header(HttpHeaders.AUTHORIZATION, "Bearer " + realToken)
//                                         .body(request)
//                                         .retrieve()
//                                         .body(String.class);

//                         log.info("Response from Strapi: {}", response);

//                 } catch (Exception ex) {

//                         log.error("Failed to connect to Strapi server: {}", ex.getMessage(), ex);

//                         throw new ServerConnectionFailedException(
//                                         "Unable to connect to Strapi server",
//                                         ex);
//                 }

//                 return Map.of(
//                                 "message", "Company created successfully",
//                                 "companyCode", savedCompany.getCompanyCode());
//         }
    
// }
