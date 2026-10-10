package com.erp.communication.exception;

import com.erp.communication.channel.CommunicationChannel;
import lombok.Getter;

@Getter
public class UnsupportedChannelException extends RuntimeException {

    private final CommunicationChannel channel;

    public UnsupportedChannelException(CommunicationChannel channel) {
        super("Communication channel [" + channel + "] is not supported in the current release. Only EMAIL via SMTP is currently active.");
        this.channel = channel;
    }
}
