package com.erp.manufacturing.completion.repository;

import com.erp.manufacturing.completion.entity.ProductionCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionCompletionRepository extends JpaRepository<ProductionCompletion, UUID> {
    Optional<ProductionCompletion> findByCompanyIdAndCompletionNo(UUID companyId, String completionNo);
    Optional<ProductionCompletion> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);
}
