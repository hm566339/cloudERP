package com.erp.account.modules.gstslab.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.gstslab.entity.GstSlab;

@Repository
public interface GstSlabRepository extends JpaRepository<GstSlab, UUID>, JpaSpecificationExecutor<GstSlab> {

    boolean existsBySlabNameIgnoreCaseAndIsDeletedFalse(String slabName);

    Optional<GstSlab> findBySlabNameIgnoreCaseAndIsDeletedFalse(String slabName);

    Optional<GstSlab> findByIdAndIsDeletedFalse(UUID id);

}
