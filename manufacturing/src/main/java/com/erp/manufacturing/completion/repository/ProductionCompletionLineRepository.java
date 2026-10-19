package com.erp.manufacturing.completion.repository;

import com.erp.manufacturing.completion.entity.ProductionCompletionLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ProductionCompletionLineRepository extends JpaRepository<ProductionCompletionLine, UUID> {
}
