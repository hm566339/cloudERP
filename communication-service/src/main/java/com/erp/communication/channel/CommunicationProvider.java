package com.erp.communication.channel;

import com.erp.communication.model.CommunicationResult;

public interface CommunicationProvider {

    CommunicationChannel getChannel();

    String getProviderName();

    boolean isEnabled();
}
