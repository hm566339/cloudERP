package com.erp.crm.modules.account.dto.request;

import com.erp.crm.modules.account.enums.DecisionMakerRole;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactCreateRequest {

    private UUID accountId;
    private String salutation;

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;
    private String designation;
    private String departmentName;
    private String email;
    private String phone;
    private String mobile;

    @Builder.Default
    private Boolean isPrimaryContact = false;

    @Builder.Default
    private DecisionMakerRole decisionMakerRole = DecisionMakerRole.EVALUATOR;

    private String linkedinUrl;
    private UUID ownerUserId;
}

