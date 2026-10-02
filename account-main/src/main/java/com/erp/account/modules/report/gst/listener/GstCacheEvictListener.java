package com.erp.account.modules.report.gst.listener;

import com.erp.account.modules.report.gst.event.GstCacheEvictEvent;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class GstCacheEvictListener {

    private final CacheManager cacheManager;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGstCacheEvict(GstCacheEvictEvent event) {
        if (cacheManager.getCache("gstSummaryReportCache") != null) {
            cacheManager.getCache("gstSummaryReportCache").clear();
        }
    }
}
