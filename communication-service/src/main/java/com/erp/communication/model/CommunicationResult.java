package com.erp.communication.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationResult {

    private boolean success;
    private String providerName;
    private String providerMessageId;
    private String errorMessage;
    private long durationMs;
    @Builder.Default
    private boolean retryable = true;

    public static CommunicationResult success(String providerName, String providerMessageId, long durationMs) {
        return CommunicationResult.builder()
                .success(true)
                .providerName(providerName)
                .providerMessageId(providerMessageId)
                .durationMs(durationMs)
                .retryable(false)
                .build();
    }

    public static CommunicationResult failure(String providerName, String errorMessage, long durationMs) {
        return CommunicationResult.builder()
                .success(false)
                .providerName(providerName)
                .errorMessage(errorMessage)
                .durationMs(durationMs)
                .retryable(true)
                .build();
    }

    public static CommunicationResult failure(String providerName, String errorMessage, boolean retryable, long durationMs) {
        return CommunicationResult.builder()
                .success(false)
                .providerName(providerName)
                .errorMessage(errorMessage)
                .durationMs(durationMs)
                .retryable(retryable)
                .build();
    }
}
