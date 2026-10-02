package com.erp.account.modules.auditlog.aop;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HibernateListenerConfigurer {

    private final EntityManagerFactory entityManagerFactory;
    private final HibernateAuditListener hibernateAuditListener;

    @PostConstruct
    public void registerListeners() {
        SessionFactoryImplementor sessionFactory = entityManagerFactory.unwrap(SessionFactoryImplementor.class);
        EventListenerRegistry registry = sessionFactory.getServiceRegistry().getService(EventListenerRegistry.class);

        if (registry != null) {
            registry.getEventListenerGroup(EventType.POST_INSERT).appendListener(hibernateAuditListener);
            registry.getEventListenerGroup(EventType.POST_UPDATE).appendListener(hibernateAuditListener);
            registry.getEventListenerGroup(EventType.POST_DELETE).appendListener(hibernateAuditListener);
        }
    }
}
