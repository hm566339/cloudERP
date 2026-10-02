package com.erp.auth_service.repository;

import com.erp.auth_service.model.MemberCompanyAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

import java.util.UUID;

public interface MemberCompanyAccessRepository extends JpaRepository<MemberCompanyAccess, UUID> {
    boolean existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(UUID memberId, UUID companyId);
    java.util.List<MemberCompanyAccess> findByOrganizationMember_IdAndActiveTrue(UUID memberId);

        @Query("""
            select a from MemberCompanyAccess a
            join fetch a.company c
            where a.organizationMember.id = :memberId
              and a.organization.id = :organizationId
              and a.active = true
              and c.active = true
            order by c.companyName
            """)
        List<MemberCompanyAccess> findActiveForMember(
            @Param("memberId") UUID memberId,
            @Param("organizationId") UUID organizationId);

        @Query("""
            select a from MemberCompanyAccess a
            join fetch a.company c
            where a.organizationMember.id = :memberId
              and a.organization.id = :organizationId
              and a.company.id = :companyId
              and a.active = true
              and c.active = true
            """)
        Optional<MemberCompanyAccess> findActiveCompany(
            @Param("memberId") UUID memberId,
            @Param("organizationId") UUID organizationId,
            @Param("companyId") UUID companyId);
}