package com.erp.account.modules.report.gst.event;

import org.springframework.context.ApplicationEvent;

public class GstCacheEvictEvent extends ApplicationEvent {

    public GstCacheEvictEvent(Object source) {
        super(source);
    }
}
