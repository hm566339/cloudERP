package com.erp.account.modules.company.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.erp.account.modules.company.dto.clientdto.CompanyResponseClient;

@Service
public interface CompanyServiceSys {

    public com.erp.account.modules.company.dto.clientdto.CompanyResponseClient verifyCompany(UUID id, String companyCode, String token);
}