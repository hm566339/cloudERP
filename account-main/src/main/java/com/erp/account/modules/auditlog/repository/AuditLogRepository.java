package com.erp.account.modules.auditlog.repository;

import com.erp.account.modules.auditlog.entity.AuditLog;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {
    java.util.List<AuditLog> findByEntityNameAndEntityIdOrderByPerformedAtDesc(String entityName, UUID entityId);

    @Query("select a.performedBy, a.performedByUsername from AuditLog a " +
           "where a.performedBy in :userIds and a.performedByUsername is not null " +
           "and trim(a.performedByUsername) <> ''")
    java.util.List<Object[]> findUsernamesByPerformedByIn(@Param("userIds") Collection<UUID> userIds);
}
