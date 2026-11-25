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

    List<ChatChannelMember> findByCompanyIdAndUserId(UUID companyId, UUID userId);

    long countByChannelId(UUID channelId);

    void deleteByChannelIdAndUserId(UUID channelId, UUID userId);
}
