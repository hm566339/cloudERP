package com.erp.communication.channel.whatsapp;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.channel.CommunicationProvider;
import com.erp.communication.model.CommunicationResult;

public interface WhatsAppProvider extends CommunicationProvider {

    @Override
    default CommunicationChannel getChannel() {
        return CommunicationChannel.WHATSAPP;
    }

    CommunicationResult sendWhatsApp(WhatsAppMessage message);
}
