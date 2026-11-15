package com.erp.crm.modules.account.dto.response;

import com.erp.crm.modules.account.enums.DecisionMakerRole;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactResponse {

    private UUID id;
    private UUID companyId;
    private UUID accountId;
    private String contactCode;
    private String salutation;
    private String firstName;
    private String lastName;
    private String displayName;
    private String designation;
    private String departmentName;
    private String email;
    private String phone;
    private String mobile;
    private Boolean isPrimaryContact;
    private DecisionMakerRole decisionMakerRole;
    private String linkedinUrl;
    private UUID ownerUserId;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

