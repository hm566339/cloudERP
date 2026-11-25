package com.erp.communication.repository;

import com.erp.communication.entity.CompanyWhatsAppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyWhatsAppConfigRepository extends JpaRepository<CompanyWhatsAppConfig, UUID> {

    Optional<CompanyWhatsAppConfig> findByCompanyIdAndIsActiveTrue(UUID companyId);

    Optional<CompanyWhatsAppConfig> findByCompanyId(UUID companyId);

    Optional<CompanyWhatsAppConfig> findByPhoneNumberIdAndIsActiveTrue(String phoneNumberId);

    Optional<CompanyWhatsAppConfig> findByWebhookVerifyTokenAndIsActiveTrue(String webhookVerifyToken);
}
