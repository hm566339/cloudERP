package com.erp.manufacturing.scrap.repository;

import com.erp.manufacturing.scrap.entity.ProductionScrap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ProductionScrapRepository extends JpaRepository<ProductionScrap, UUID> {
}
