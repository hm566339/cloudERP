package com.erp.account.modules.banktransaction.service.impl;

import com.erp.account.common.exception.BusinessException;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.banktransaction.service.BankLedgerPdfService;
import com.erp.account.modules.banktransaction.service.BankTransactionService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankLedgerPdfServiceImpl implements BankLedgerPdfService {

    private final BankTransactionService bankTransactionService;
    private final CompanyRepository companyRepository;
    private final TemplateEngine templateEngine;

    @Override
    @Transactional(readOnly = true)
    public byte[] generateBankLedgerPdf(UUID bankAccountId, LocalDate startDate, LocalDate endDate, UUID companyId) {
        
        UUID resolvedCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
        if (resolvedCompanyId == null) {
            throw new BusinessException("Company ID is required to generate Bank Ledger PDF");
        }

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new BusinessException("Company not found with ID: " + resolvedCompanyId));

        BankLedgerResponse bankLedger;
        if (startDate != null && endDate != null) {
            bankLedger = bankTransactionService.getBankLedgerForDateRange(bankAccountId, startDate, endDate, PageRequest.of(0, 10000));
        } else {
            bankLedger = bankTransactionService.getBankLedger(bankAccountId, PageRequest.of(0, 10000));
        }

        return generatePdf(bankLedger, company, startDate, endDate);
    }

    private byte[] generatePdf(BankLedgerResponse bankLedger, Company company, LocalDate startDate, LocalDate endDate) {
        try {
            Context context = new Context();
            context.setVariable("company", company);
            context.setVariable("ledger", bankLedger);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            String period = "";
            if (startDate != null && endDate != null) {
                period = startDate.format(formatter) + " to " + endDate.format(formatter);
            } else {
                period = "All Time";
            }
            context.setVariable("period", period);
            context.setVariable("generatedDate", LocalDate.now().format(formatter));

            String html = templateEngine.process("bank-ledger-template", context);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating Bank Ledger PDF", e);
            throw new BusinessException("Failed to generate Bank Ledger PDF");
        }
    }
}
