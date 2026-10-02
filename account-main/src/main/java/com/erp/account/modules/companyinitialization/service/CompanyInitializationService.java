package com.erp.account.modules.companyinitialization.service;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.companyinitialization.dto.CompanyInitializationResult;

public interface CompanyInitializationService {

    CompanyInitializationResult initializeCompany(Company company);
}
