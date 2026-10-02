package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "plan_module", uniqueConstraints = @UniqueConstraint(name = "uk_plan_module", columnNames = {"plan_id", "module_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanModule {
    @Id @GeneratedValue(generator = "UUID") @Column(columnDefinition = "uuid") private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "plan_id", nullable = false) private Plan plan;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "module_id", nullable = false) private Module module;
    @Column(nullable = false) @Builder.Default private Boolean enabled = true;
}