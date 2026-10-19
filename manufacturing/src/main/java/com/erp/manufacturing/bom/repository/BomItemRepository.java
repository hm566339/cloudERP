package com.erp.manufacturing.bom.repository;

import com.erp.manufacturing.bom.entity.BomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BomItemRepository extends JpaRepository<BomItem, UUID> {
    List<BomItem> findAllByBomRevision_IdAndCompanyId(UUID bomRevisionId, UUID companyId);
    List<BomItem> findAllByCompanyId(UUID companyId);
}
