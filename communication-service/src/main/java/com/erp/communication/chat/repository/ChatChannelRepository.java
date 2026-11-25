package com.erp.communication.chat.repository;

import com.erp.communication.chat.entity.ChatChannel;
import com.erp.communication.chat.model.ChatChannelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatChannelRepository extends JpaRepository<ChatChannel, UUID> {

    Optional<ChatChannel> findByIdAndCompanyId(UUID id, UUID companyId);

    List<ChatChannel> findByCompanyIdOrderByUpdatedAtDesc(UUID companyId);

    Optional<ChatChannel> findByCompanyIdAndNameAndType(UUID companyId, String name, ChatChannelType type);

    @Query("SELECT c FROM ChatChannel c JOIN ChatChannelMember m ON m.channel.id = c.id " +
           "WHERE c.companyId = :companyId AND m.userId = :userId " +
           "ORDER BY c.updatedAt DESC")
    List<ChatChannel> findChannelsForUser(@Param("companyId") UUID companyId, @Param("userId") UUID userId);
}
