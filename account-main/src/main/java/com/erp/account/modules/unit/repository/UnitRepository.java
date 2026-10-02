package com.erp.account.modules.unit.repository;

import com.erp.account.modules.unit.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {

    Optional<Unit> findByCodeIgnoreCase(String code);

    @Query("SELECT u FROM Unit u WHERE LOWER(u.code) = LOWER(:code) OR LOWER(u.symbol) = LOWER(:code) OR LOWER(u.name) = LOWER(:code)")
    Optional<Unit> findByCodeOrSymbolOrName(@Param("code") String code);
}
