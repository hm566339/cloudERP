package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    /*
     * COMPANY
     */
    private String companyName;

    /*
     * MODULE STATS
     */
    private ModuleStats modules;

    /*
     * ROLE STATS
     */
    private RoleStats roles;

    /*
     * USER STATS
     */
    private UserStats users;

    /*
     * SESSION STATS
     */
    private SessionStats sessions;

    /*
     * PORTAL ACCESS STATS
     */
    private PortalAccessStats portalAccess;

    /*
     * AUTHORIZATION CODE STATS
     */
    private AuthorizationCodeStats authorizationCodes;

    /*
     * MODULE STATS
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleStats {

        private long total;
        private long active;
        private long inactive;
    }

    /*
     * ROLE STATS
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleStats {

        private long total;

        private List<RoleGraphItem> items;
    }

    /*
     * ROLE GRAPH
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleGraphItem {

        private String roleName;

        private long assignedUsers;
    }

    /*
     * USER STATS
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStats {

        private long total;

        private long active;

        private long inactive;

        private long blocked;

        private long unverified;
    }

    /*
     * SESSION STATS
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionStats {

        private long total;

        private long active;

        private long expired;
    }

    /*
     * PORTAL ACCESS STATS
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortalAccessStats {

        private long total;

        private long active;

        private long inactive;

        private List<PortalAccessGraphItem> items;
    }

    /*
     * PORTAL ACCESS GRAPH
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortalAccessGraphItem {

        private String moduleName;

        private long grantedUsers;
    }

    /*
     * AUTHORIZATION CODE STATS
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorizationCodeStats {

        private long total;

        private long active;

        private long used;

        private long expired;
    }
}