package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "module_route")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleRoute {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "api_pattern", nullable = false)
    private String apiPattern;

    @Column(name = "service_url", nullable = false)
    private String serviceUrl;

    @Column(name = "route_order")
    private Integer routeOrder = 0;

    @Column(name = "active")
    private Boolean active = true;
}
