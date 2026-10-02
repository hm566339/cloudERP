package com.erp.account.modules.report.gst.ecl.controller;

import com.erp.account.modules.report.gst.ecl.entity.ElectronicCreditLedger;
import com.erp.account.modules.report.gst.ecl.repository.ElectronicCreditLedgerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gst/ecl")
public class ElectronicCreditLedgerController {

    @Autowired
    private ElectronicCreditLedgerRepository repository;

    @GetMapping
    public ResponseEntity<List<ElectronicCreditLedger>> getAllLedgers() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{companyId}/{financialYearId}/{month}")
    public ResponseEntity<ElectronicCreditLedger> getLedger(
            @PathVariable UUID companyId, 
            @PathVariable UUID financialYearId, 
            @PathVariable Integer month) {
        return repository.findByCompanyIdAndFinancialYearIdAndMonth(companyId, financialYearId, month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
