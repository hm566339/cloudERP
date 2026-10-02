package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.response.DashboardResponse;
import com.erp.auth_service.dto.response.PortalAccessCountProjection;
import com.erp.auth_service.dto.response.RoleCountProjection;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.repository.AuthorizationCodeRepository;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.service.DashboardService;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final CompanyRepository companyRepository;
    private final ModuleRepository moduleRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final UserPortalAccessRepository userPortalAccessRepository;
    private final AuthorizationCodeRepository authorizationCodeRepository;

    @Override
    public DashboardResponse getDashboard(UUID companyId) {

        LocalDateTime now = LocalDateTime.now();

        /*
         * COMPANY VALIDATION
         */
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Company not found"));

        /*
         * MODULE STATS
         */
        long totalModules =
                moduleRepository.countModulesByCompany(companyId);

        long activeModules =
                moduleRepository.countActiveModulesByCompany(companyId);

        long inactiveModules =
                moduleRepository.countInactiveModulesByCompany(companyId);

        /*
         * ROLE STATS
         */
        long totalRoles =
                roleRepository.countByCompanyId(companyId);

        List<DashboardResponse.RoleGraphItem> roleItems =
                roleRepository.getRoleAssignmentCounts(companyId)
                        .stream()
                        .map(this::mapRoleItem)
                        .toList();

        /*
         * USER STATS
         */
        long totalUsers =
                userRepository.countByCompanyId(companyId);

        long activeUsers =
                userRepository.countByCompanyIdAndAccountStatus(
                        companyId,
                        AccountStatus.ACTIVE
                );

        long inactiveUsers =
                userRepository.countByCompanyIdAndAccountStatus(
                        companyId,
                        AccountStatus.INACTIVE
                );

        long blockedUsers =
                userRepository.countBlockedUsersByCompany(
                        companyId,
                        AccountStatus.BLOCKED,
                        now
                );

        long unverifiedUsers =
                userRepository.countByCompanyIdAndEmailStatus(
                        companyId,
                        Status.UNVERIFIED
                );

        /*
         * SESSION STATS
         */
        long totalSessions =
                sessionRepository.countByCompanyId(companyId);

        long activeSessions =
                sessionRepository.countActiveSessionsByCompany(
                        companyId,
                        now
                );

        long expiredSessions =
                sessionRepository.countExpiredSessionsByCompany(
                        companyId,
                        now
                );

        /*
         * PORTAL ACCESS STATS
         */
        long totalPortalAccess =
                userPortalAccessRepository.countByCompany(companyId);

        long activePortalAccess =
                userPortalAccessRepository.countByCompanyAndStatus(
                        companyId,
                        true
                );

        long inactivePortalAccess =
                userPortalAccessRepository.countByCompanyAndStatus(
                        companyId,
                        false
                );

        List<DashboardResponse.PortalAccessGraphItem> portalAccessItems =
                userPortalAccessRepository
                        .getPortalAccessCountsByModule(companyId)
                        .stream()
                        .map(this::mapPortalAccessItem)
                        .toList();

        /*
         * AUTHORIZATION CODE STATS
         */
        long totalAuthCodes =
                authorizationCodeRepository.countByCompanyId(companyId);

        long activeAuthCodes =
                authorizationCodeRepository
                        .countActiveCodes(companyId, now);

        long usedAuthCodes =
                authorizationCodeRepository
                        .countUsedCodes(companyId);

        long expiredAuthCodes =
                authorizationCodeRepository
                        .countExpiredCodes(companyId, now);

        /*
         * BUILD RESPONSE
         */
        return DashboardResponse.builder()

                .companyName(company.getCompanyName())

                .modules(
                        DashboardResponse.ModuleStats.builder()
                                .total(totalModules)
                                .active(activeModules)
                                .inactive(inactiveModules)
                                .build()
                )

                .roles(
                        DashboardResponse.RoleStats.builder()
                                .total(totalRoles)
                                .items(roleItems)
                                .build()
                )

                .users(
                        DashboardResponse.UserStats.builder()
                                .total(totalUsers)
                                .active(activeUsers)
                                .inactive(inactiveUsers)
                                .blocked(blockedUsers)
                                .unverified(unverifiedUsers)
                                .build()
                )

                .sessions(
                        DashboardResponse.SessionStats.builder()
                                .total(totalSessions)
                                .active(activeSessions)
                                .expired(expiredSessions)
                                .build()
                )

                .portalAccess(
                        DashboardResponse.PortalAccessStats.builder()
                                .total(totalPortalAccess)
                                .active(activePortalAccess)
                                .inactive(inactivePortalAccess)
                                .items(portalAccessItems)
                                .build()
                )

                .authorizationCodes(
                        DashboardResponse.AuthorizationCodeStats.builder()
                                .total(totalAuthCodes)
                                .active(activeAuthCodes)
                                .used(usedAuthCodes)
                                .expired(expiredAuthCodes)
                                .build()
                )

                .build();
    }

    /*
     * ROLE GRAPH MAPPER
     */
    private DashboardResponse.RoleGraphItem mapRoleItem(
            RoleCountProjection item
    ) {

        return DashboardResponse.RoleGraphItem.builder()
                .roleName(item.getRoleName())
                .assignedUsers(
                        item.getAssignedUsers() == null
                                ? 0L
                                : item.getAssignedUsers()
                )
                .build();
    }

    /*
     * PORTAL ACCESS GRAPH MAPPER
     */
    private DashboardResponse.PortalAccessGraphItem mapPortalAccessItem(
            PortalAccessCountProjection item
    ) {

        return DashboardResponse.PortalAccessGraphItem.builder()
                .moduleName(item.getModuleName())
                .grantedUsers(
                        item.getGrantedUsers() == null
                                ? 0L
                                : item.getGrantedUsers()
                )
                .build();
    }
}