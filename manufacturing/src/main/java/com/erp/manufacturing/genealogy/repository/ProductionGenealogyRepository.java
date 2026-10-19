package com.erp.manufacturing.genealogy.repository;

import com.erp.manufacturing.genealogy.entity.ProductionGenealogy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ProductionGenealogyRepository extends JpaRepository<ProductionGenealogy, UUID> {
}
