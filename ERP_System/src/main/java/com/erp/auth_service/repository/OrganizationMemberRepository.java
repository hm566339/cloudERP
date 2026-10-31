package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.utility.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    boolean existsByOrganization_IdAndUser_EmailIgnoreCase(UUID organizationId, String email);

    Optional<OrganizationMember> findByOrganization_IdAndUser_IdAndMembershipStatus(UUID organizationId, UUID userId,
            MembershipStatus status);

    Optional<OrganizationMember> findByOrganization_IdAndUser_Id(UUID organizationId, UUID userId);

    java.util.List<OrganizationMember> findByOrganization_Id(UUID organizationId);

    long countByOrganization_Id(UUID organizationId);

    long countByOrganization_IdAndMembershipStatus(UUID organizationId, MembershipStatus status);

    Optional<OrganizationMember> findFirstByOrganization_IdAndMembershipStatus(UUID organizationId, MembershipStatus status);

    @Query("""
            select m from OrganizationMember m
            join fetch m.user u
            join fetch m.organization o
            where (lower(u.email) = lower(:email) or lower(u.username) = lower(:email))
              and o.id = :organizationId
              and m.membershipStatus = :status
              and m.deletedAt is null
            """)
    Optional<OrganizationMember> findActiveByOrganizationAndEmail(
            @Param("organizationId") UUID organizationId,
            @Param("email") String email,
            @Param("status") MembershipStatus status);
}
