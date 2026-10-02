package com.erp.account.modules.gst.repository;

import com.erp.account.modules.gst.entity.GstRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GstRegistrationRepository extends JpaRepository<GstRegistration, UUID> {
    List<GstRegistration> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    Optional<GstRegistration> findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(UUID companyId);
    Optional<GstRegistration> findByGstinAndIsDeletedFalse(String gstin);
}
