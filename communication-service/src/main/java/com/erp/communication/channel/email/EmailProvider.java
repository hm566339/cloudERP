package com.erp.communication.channel.email;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.channel.CommunicationProvider;
import com.erp.communication.model.CommunicationResult;

public interface EmailProvider extends CommunicationProvider {

    @Override
    default CommunicationChannel getChannel() {
        return CommunicationChannel.EMAIL;
    }

    CommunicationResult sendEmail(EmailMessage message);
}
