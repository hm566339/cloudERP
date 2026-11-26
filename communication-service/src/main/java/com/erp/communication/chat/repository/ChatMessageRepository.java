package com.erp.communication.chat.repository;

import com.erp.communication.chat.entity.ChatMessage;
import com.erp.communication.chat.model.ChatMessageType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    long countByCompanyIdAndChannelId(UUID companyId, UUID channelId);

    long countByCompanyIdAndChannelIdAndCreatedAtAfter(UUID companyId, UUID channelId, LocalDateTime createdAt);

    default long countUnreadMessages(UUID companyId, UUID channelId, LocalDateTime lastReadAt) {
        if (lastReadAt == null) {
            return countByCompanyIdAndChannelId(companyId, channelId);
        }
        return countByCompanyIdAndChannelIdAndCreatedAtAfter(companyId, channelId, lastReadAt);
    }

    Optional<ChatMessage> findByCompanyIdAndReferenceIdAndMessageType(UUID companyId, UUID referenceId, ChatMessageType messageType);

    List<ChatMessage> findByCompanyIdAndReferenceId(UUID companyId, UUID referenceId);

    void deleteByCompanyIdAndChannelId(UUID companyId, UUID channelId);
}
