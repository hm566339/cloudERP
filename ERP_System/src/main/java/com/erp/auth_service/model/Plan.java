package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plan", uniqueConstraints = @UniqueConstraint(name = "uk_plan_code", columnNames = "code"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Plan {
    @Id @GeneratedValue(generator = "UUID") @Column(columnDefinition = "uuid")
    private UUID id;
    @Column(nullable = false, length = 80) private String code;
    @Column(nullable = false, length = 160) private String name;
    @Column(nullable = false) @Builder.Default private Integer trialDays = 30;
    private Integer maxUsers;
    private Integer maxCompanies;
    @Column(nullable = false) @Builder.Default private Boolean active = true;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private LocalDateTime updatedAt;
}