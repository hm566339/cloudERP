package com.erp.auth_service.repository;

import com.erp.auth_service.model.UserRole;
import com.erp.auth_service.utility.UserRoleId;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository
                extends JpaRepository<UserRole, UserRoleId> {

        /*
         * FIND ROLE
         */
        Optional<UserRole> findByUser_IdAndRole_Id(
                        UUID userId,
                        UUID roleId);

        /*
         * USER ROLES
         */
        List<UserRole> findAllByUser_Id(UUID userId);

        /*
         * SAFE EXISTS CHECK
         * (Hibernate 7 compatible)
         */
        @Query("""
                        SELECT COUNT(ur) > 0
                        FROM UserRole ur
                        WHERE ur.user.id = :userId
                        AND ur.role.id = :roleId
                        """)
        boolean roleExists(
                        @Param("userId") UUID userId,
                        @Param("roleId") UUID roleId);

        @Query("""
                        SELECT ur
                        FROM UserRole ur
                        JOIN ur.user u
                        WHERE ur.role.id = :roleId
                          AND (
                                :search IS NULL
                                OR :search = ''
                                OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
                                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                          )
                        """)
        Page<UserRole> findAllByRoleIdWithUserSearch(
                        @Param("roleId") UUID roleId,
                        @Param("search") String search,
                        Pageable pageable);
}