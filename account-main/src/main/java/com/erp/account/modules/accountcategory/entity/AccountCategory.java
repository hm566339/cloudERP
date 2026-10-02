package com.erp.account.modules.accountcategory.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.AccountNature;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(
        name = "account_category",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"company_id", "code"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountCategory extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "nature", nullable = false)
    private AccountNature nature;

        // `isDeleted` is provided by BaseEntity; remove duplicate field to avoid mapping conflicts

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AccountGroup> accountGroups;
}
