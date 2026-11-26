package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatMemberRole;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddChannelMembersRequest {

    @NotEmpty(message = "memberUserIds must not be empty")
    private List<UUID> memberUserIds;

    @Builder.Default
    private ChatMemberRole role = ChatMemberRole.MEMBER;
}
