package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMemberRoleRequest {

    @NotNull(message = "Role is required")
    private ChatMemberRole role;
}
