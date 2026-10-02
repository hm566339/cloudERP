package com.erp.account.modules.gljournal.controller;

import com.erp.account.modules.gljournal.dto.response.GlJournalLineResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineFilterDto;
import com.erp.account.modules.gljournal.service.GlJournalLineService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/gl/journal-lines")
@AllArgsConstructor
public class GlJournalLineController {

    private final GlJournalLineService service;

    @PostMapping("/journal/{journalId}")
    public ResponseEntity<GlJournalLineResponse> create(@PathVariable UUID journalId, @Valid @RequestBody RequestWrapper<GlJournalLineRequest> requestWrapper) {
        GlJournalLineResponse resp = service.createLine(journalId, requestWrapper);
        return ResponseEntity.created(URI.create("/api/account/gl/journal-lines/" + resp.getId())).body(resp);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GlJournalLineResponse> update(@PathVariable UUID id, @Valid @RequestBody RequestWrapper<GlJournalLineRequest> requestWrapper) {
        GlJournalLineResponse resp = service.updateLine(id, requestWrapper);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteLine(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<com.erp.account.common.dto.response.ApiResponse<com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(com.erp.account.common.dto.response.ApiResponse.success(service.getLineProfileById(id), "Journal Line retrieved successfully."));
    }

    @GetMapping
    public ResponseEntity<Page<GlJournalLineResponse>> list(
            @ModelAttribute GlJournalLineFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "id") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        org.springframework.data.domain.Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, Math.min(size, 100), org.springframework.data.domain.Sort.by(direction, sortBy));

        return ResponseEntity.ok(service.getAllLines(filter, pageable));
    }

    @GetMapping("/journal/{journalId}")
    public ResponseEntity<Page<GlJournalLineResponse>> getByJournal(@PathVariable UUID journalId, Pageable pageable) {
        return ResponseEntity.ok(service.getLinesByJournal(journalId, pageable));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<Page<GlJournalLineResponse>> getByAccount(@PathVariable UUID accountId, Pageable pageable) {
        return ResponseEntity.ok(service.getAccountTransactions(accountId, pageable));
    }

    @GetMapping("/ledger/{accountId}")
    public ResponseEntity<List<GlJournalLineResponse>> ledger(@PathVariable UUID accountId, Pageable pageable) {
        return ResponseEntity.ok(service.getLedgerLines(accountId, pageable));
    }
}
