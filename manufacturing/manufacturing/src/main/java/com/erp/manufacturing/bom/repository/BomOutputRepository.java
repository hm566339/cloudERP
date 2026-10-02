package com.erp.manufacturing.bom.repository;

import com.erp.manufacturing.bom.entity.BomOutput;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface BomOutputRepository extends JpaRepository<BomOutput, UUID> {
}
