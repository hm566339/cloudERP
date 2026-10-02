package com.erp.account.modules.common.repository;

import com.erp.account.modules.common.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CountryRepository extends JpaRepository<Country, UUID> {
    Optional<Country> findByCountryCodeIgnoreCase(String countryCode);
}
