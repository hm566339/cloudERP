package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "organization_module", uniqueConstraints = @UniqueConstraint(name = "uk_organization_module", columnNames = {"organization_id", "module_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrganizationModule {
    @Id @GeneratedValue(generator = "UUID") @Column(columnDefinition = "uuid") private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "organization_id", nullable = false) private Organization organization;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "module_id", nullable = false) private Module module;
    @Column(nullable = false) @Builder.Default private Boolean enabled = true;
}