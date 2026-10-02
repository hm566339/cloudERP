package com.erp.account.modules.gst.controller;

import com.erp.account.modules.gst.entity.GstItc;
import com.erp.account.modules.gst.entity.GstTaxSummary;
import com.erp.account.modules.gst.repository.GstItcRepository;
import com.erp.account.modules.gst.repository.GstTaxSummaryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/gst/ledger")
@RequiredArgsConstructor
@Tag(name = "GST Ledger", description = "Endpoints for GST Output and Input Tax Ledgers, and ITC Management")
public class GstLedgerController {

    private final GstItcRepository gstItcRepository;
    private final GstTaxSummaryRepository gstTaxSummaryRepository;

    @Operation(summary = "Get ITC Balance", description = "Retrieve ITC balance for a specific company and financial year")
    @GetMapping("/itc/{companyId}")
    public ResponseEntity<List<GstItc>> getItcBalance(
            @PathVariable UUID companyId,
            @RequestParam String financialYear) {
        return ResponseEntity.ok(gstItcRepository.findByCompanyIdAndFinancialYearAndIsDeletedFalse(companyId, financialYear));
    }

    @Operation(summary = "Get Tax Summary", description = "Retrieve GST Tax Summary (Output Tax vs ITC) for a company")
    @GetMapping("/tax-summary/{companyId}")
    public ResponseEntity<List<GstTaxSummary>> getTaxSummary(
            @PathVariable UUID companyId,
            @RequestParam String financialYear) {
        return ResponseEntity.ok(gstTaxSummaryRepository.findByCompanyIdAndFinancialYearAndIsDeletedFalse(companyId, financialYear));
    }
}
