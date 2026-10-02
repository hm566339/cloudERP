package com.erp.account.modules.gst.repository;

import com.erp.account.modules.gst.entity.GstStateCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GstStateCodeRepository extends JpaRepository<GstStateCode, UUID> {
    Optional<GstStateCode> findByStateCodeAndIsDeletedFalse(String stateCode);
    Optional<GstStateCode> findByStateNameIgnoreCaseAndIsDeletedFalse(String stateName);
    java.util.List<GstStateCode> findAllByIsDeletedFalse();

    @org.springframework.data.jpa.repository.Query("SELECT g FROM GstStateCode g WHERE g.isDeleted = false AND " +
           "(:search IS NULL OR :search = '' OR LOWER(g.stateName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(g.stateCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<GstStateCode> findAllWithSearch(@org.springframework.data.repository.query.Param("search") String search, org.springframework.data.domain.Pageable pageable);
}
