package com.erp.account.modules.quotation.service;

import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuotationJobService {

    private final QuotationRepository quotationRepository;

    // Run every day at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void expireOldQuotations() {
        log.info("Starting scheduled job: Expire Old Quotations");
        try {
            LocalDate today = LocalDate.now();
            List<Quotation> quotations = quotationRepository.findAll();
            for (Quotation q : quotations) {
                if (Boolean.FALSE.equals(q.getIsDeleted()) && 
                    (q.getStatus() == QuotationStatus.SENT || q.getStatus() == QuotationStatus.DRAFT)) {
                    if (q.getValidUntil() != null && today.isAfter(q.getValidUntil())) {
                        q.setStatus(QuotationStatus.EXPIRED);
                        quotationRepository.save(q);
                    }
                }
            }
            log.info("Finished scheduled job: Expire Old Quotations");
        } catch (Exception e) {
            log.error("Error occurred while expiring old quotations", e);
        }
    }
}
