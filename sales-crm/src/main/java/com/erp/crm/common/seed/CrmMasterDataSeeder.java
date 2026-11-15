package com.erp.crm.common.seed;

import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.enums.IntegrationProvider;
import com.erp.crm.modules.integration.repository.CrmIntegrationChannelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CrmMasterDataSeeder implements CommandLineRunner {

    private final CrmIntegrationChannelRepository channelRepository;

    @Value("${crm.seed.master-data:true}")
    private boolean seedMasterData;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedMasterData) {
            log.info("CRM Master data seeding is disabled.");
            return;
        }

        log.info("Initializing CRM Master Integration Channels...");
        seedIntegrationChannels();
        log.info("CRM Master Data Seeding completed successfully.");
    }

    private void seedIntegrationChannels() {
        List<CrmIntegrationChannel> defaultChannels = List.of(
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.INDIAMART)
                        .providerName("IndiaMART Lead Push")
                        .providerCategory("B2B_MARKETPLACE")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.TRADEINDIA)
                        .providerName("TradeIndia Lead Ingestion")
                        .providerCategory("B2B_MARKETPLACE")
                        .supportsPush(true)
                        .supportsPull(true)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.JUSTDIAL)
                        .providerName("Justdial Lead Ingestion")
                        .providerCategory("LOCAL_MARKETPLACE")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.META_LEAD_ADS)
                        .providerName("Meta Lead Ads (Facebook & Instagram)")
                        .providerCategory("SOCIAL_ADS")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.GOOGLE_LEAD_FORMS)
                        .providerName("Google Lead Form Assets")
                        .providerCategory("SEARCH_ADS")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.EXOTEL_IVR)
                        .providerName("Exotel Cloud Telephony & IVR")
                        .providerCategory("TELEPHONY")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.WHATSAPP_CLOUD)
                        .providerName("WhatsApp Cloud Business API")
                        .providerCategory("MESSAGING")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.WEBSITE_FORM)
                        .providerName("Website Contact Form Webhook")
                        .providerCategory("INBOUND")
                        .supportsPush(true)
                        .supportsPull(false)
                        .isActive(true)
                        .build(),
                CrmIntegrationChannel.builder()
                        .providerCode(IntegrationProvider.CSV_IMPORT)
                        .providerName("CSV / Excel Lead Import")
                        .providerCategory("IMPORT")
                        .supportsPush(false)
                        .supportsPull(false)
                        .isActive(true)
                        .build()
        );

        for (CrmIntegrationChannel channel : defaultChannels) {
            if (channelRepository.findByProviderCode(channel.getProviderCode()).isEmpty()) {
                channelRepository.save(channel);
                log.info("Seeded integration channel: {}", channel.getProviderCode());
            }
        }
    }
}

