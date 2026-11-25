package com.erp.communication.chat.repository;

import com.erp.communication.chat.entity.ChatMessage;
import com.erp.communication.chat.model.ChatMessageType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByCompanyIdAndChannelIdOrderByCreatedAtDesc(UUID companyId, UUID channelId, Pageable pageable);

    Optional<ChatMessage> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<ChatMessage> findFirstByChannelIdOrderByCreatedAtDesc(UUID channelId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.companyId = :companyId AND m.channel.id = :channelId " +
           "AND (:lastReadAt IS NULL OR m.createdAt > :lastReadAt)")
    long countUnreadMessages(@Param("companyId") UUID companyId,
                             @Param("channelId") UUID channelId,
                             @Param("lastReadAt") LocalDateTime lastReadAt);

    Optional<ChatMessage> findByCompanyIdAndReferenceIdAndMessageType(UUID companyId, UUID referenceId, ChatMessageType messageType);

    List<ChatMessage> findByCompanyIdAndReferenceId(UUID companyId, UUID referenceId);
}
