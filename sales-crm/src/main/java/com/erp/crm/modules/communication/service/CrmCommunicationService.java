package com.erp.crm.modules.communication.service;

import com.erp.crm.modules.communication.dto.CallLogRequest;
import com.erp.crm.modules.communication.dto.CallLogResponse;
import com.erp.crm.modules.communication.dto.MessageResponse;
import com.erp.crm.modules.communication.dto.SendMessageRequest;

import java.util.List;
import java.util.UUID;

public interface CrmCommunicationService {

    MessageResponse sendMessage(SendMessageRequest request, UUID requestCompanyId);

    List<MessageResponse> getConversationMessages(UUID conversationId, UUID requestCompanyId);

    CallLogResponse logCall(CallLogRequest request, UUID requestCompanyId);

    List<CallLogResponse> getCallsForEntity(String entityType, UUID entityId, UUID requestCompanyId);
}

