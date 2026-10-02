package com.erp.account.modules.report.gst.gstr2b.controller;

import com.erp.account.modules.report.gst.gstr2b.entity.Gstr2bReconciliation;
import com.erp.account.modules.report.gst.gstr2b.repository.Gstr2bReconciliationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gst/gstr2b")
public class Gstr2bReconciliationController {

    @Autowired
    private Gstr2bReconciliationRepository repository;

    @GetMapping("/{companyId}")
    public ResponseEntity<List<Gstr2bReconciliation>> getHistory(@PathVariable UUID companyId) {
        return ResponseEntity.ok(repository.findByCompanyIdOrderByReconciliationDateDesc(companyId));
    }
}
