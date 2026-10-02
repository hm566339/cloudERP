package com.erp.account.modules.quotation.repository;

import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuotationAcceptanceTokenRepository extends JpaRepository<QuotationAcceptanceToken, UUID> {
    Optional<QuotationAcceptanceToken> findByTokenHash(String tokenHash);
}
