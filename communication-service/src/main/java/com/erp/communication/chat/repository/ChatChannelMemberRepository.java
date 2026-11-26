package com.erp.communication.chat.repository;

import com.erp.communication.chat.entity.ChatChannelMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatChannelMemberRepository extends JpaRepository<ChatChannelMember, UUID> {

    Optional<ChatChannelMember> findByChannelIdAndUserId(UUID channelId, UUID userId);

    Optional<ChatChannelMember> findByCompanyIdAndChannelIdAndUserId(UUID companyId, UUID channelId, UUID userId);

    boolean existsByChannelIdAndUserId(UUID channelId, UUID userId);

    boolean existsByCompanyIdAndChannelIdAndUserId(UUID companyId, UUID channelId, UUID userId);

    List<ChatChannelMember> findByChannelId(UUID channelId);

    List<ChatChannelMember> findByCompanyIdAndChannelId(UUID companyId, UUID channelId);

    List<ChatChannelMember> findByCompanyIdAndUserId(UUID companyId, UUID userId);

    long countByChannelId(UUID channelId);

    long countByCompanyIdAndChannelId(UUID companyId, UUID channelId);

    long countByCompanyIdAndChannelIdAndRole(UUID companyId, UUID channelId, com.erp.communication.chat.model.ChatMemberRole role);

    void deleteByChannelIdAndUserId(UUID channelId, UUID userId);

    void deleteByCompanyIdAndChannelIdAndUserId(UUID companyId, UUID channelId, UUID userId);

    void deleteByCompanyIdAndChannelId(UUID companyId, UUID channelId);
}
