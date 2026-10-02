package com.erp.account.modules.common.service;

import com.erp.account.modules.reporting.dto.response.BalanceSheetReport;
import com.erp.account.modules.reporting.dto.response.GeneralLedgerLine;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.gljournal.dto.response.GlJournalLineResponse;
import com.erp.account.modules.reporting.dto.response.ProfitLossReport;
import com.erp.account.modules.reporting.dto.response.TrialBalanceLine;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;

import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class GlJournalPdfService {

    // ─── Color Palette (ERP-grade) ────────────────────────────────────────
    private static final Color PRIMARY_DARK   = new Color(17, 24, 39);
    private static final Color PRIMARY_BLUE   = new Color(30, 58, 138);
    private static final Color HEADER_BG      = new Color(30, 58, 138);
    private static final Color HEADER_TEXT     = Color.WHITE;
    private static final Color TABLE_HEADER   = new Color(31, 41, 55);
    private static final Color TABLE_ALT_ROW  = new Color(243, 244, 246);
    private static final Color TABLE_WHITE    = Color.WHITE;
    private static final Color BORDER_COLOR   = new Color(209, 213, 219);
    private static final Color ACCENT_BLUE    = new Color(59, 130, 246);
    private static final Color LABEL_GRAY     = new Color(107, 114, 128);
    private static final Color VALUE_DARK     = new Color(17, 24, 39);
    private static final Color TOTAL_BG       = new Color(219, 234, 254);
    private static final Color TOTAL_DARK_BG  = new Color(30, 58, 138);
    private static final Color NARRATION_BG   = new Color(249, 250, 251);
    private static final Color SIGNATURE_LINE = new Color(156, 163, 175);
    private static final Color FOOTER_GRAY    = new Color(107, 114, 128);
    private static final Color DEBIT_GREEN    = new Color(5, 122, 85);
    private static final Color CREDIT_RED     = new Color(185, 28, 28);
    private static final Color STATUS_POSTED  = new Color(5, 122, 85);
    private static final Color STATUS_DRAFT   = new Color(217, 119, 6);

    // ─── Fonts ────────────────────────────────────────────────────────────
    private static final Font COMPANY_NAME_FONT    = new Font(Font.HELVETICA, 18, Font.BOLD, HEADER_TEXT);
    private static final Font COMPANY_DETAIL_FONT  = new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(191, 219, 254));
    private static final Font COMPANY_GST_FONT     = new Font(Font.HELVETICA, 8, Font.BOLD, new Color(147, 197, 253));
    private static final Font TITLE_FONT           = new Font(Font.HELVETICA, 16, Font.BOLD, PRIMARY_DARK);
    private static final Font SUBTITLE_FONT        = new Font(Font.HELVETICA, 9, Font.NORMAL, LABEL_GRAY);
    private static final Font LABEL_FONT           = new Font(Font.HELVETICA, 7.5f, Font.NORMAL, LABEL_GRAY);
    private static final Font VALUE_FONT           = new Font(Font.HELVETICA, 9, Font.BOLD, VALUE_DARK);
    private static final Font TABLE_HEADER_FONT    = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);
    private static final Font TABLE_BODY_FONT      = new Font(Font.HELVETICA, 8.5f, Font.NORMAL, VALUE_DARK);
    private static final Font TABLE_BODY_BOLD_FONT = new Font(Font.HELVETICA, 8.5f, Font.BOLD, VALUE_DARK);
    private static final Font AMOUNT_FONT          = new Font(Font.HELVETICA, 9, Font.NORMAL, VALUE_DARK);
    private static final Font AMOUNT_BOLD_FONT     = new Font(Font.HELVETICA, 9, Font.BOLD, VALUE_DARK);
    private static final Font DEBIT_FONT           = new Font(Font.HELVETICA, 9, Font.BOLD, DEBIT_GREEN);
    private static final Font CREDIT_FONT          = new Font(Font.HELVETICA, 9, Font.BOLD, CREDIT_RED);
    private static final Font TOTAL_LABEL_FONT     = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
    private static final Font TOTAL_AMOUNT_FONT    = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
    private static final Font NARRATION_LABEL_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, PRIMARY_DARK);
    private static final Font NARRATION_BODY_FONT  = new Font(Font.HELVETICA, 9, Font.NORMAL, VALUE_DARK);
    private static final Font SIGNATURE_TITLE_FONT = new Font(Font.HELVETICA, 8, Font.BOLD, VALUE_DARK);
    private static final Font SIGNATURE_LABEL_FONT = new Font(Font.HELVETICA, 7, Font.NORMAL, LABEL_GRAY);
    private static final Font FOOTER_FONT          = new Font(Font.HELVETICA, 7, Font.NORMAL, FOOTER_GRAY);
    private static final Font STATUS_FONT_POSTED   = new Font(Font.HELVETICA, 8, Font.BOLD, STATUS_POSTED);
    private static final Font STATUS_FONT_DRAFT    = new Font(Font.HELVETICA, 8, Font.BOLD, STATUS_DRAFT);
    private static final Font SECTION_FONT         = new Font(Font.HELVETICA, 9, Font.BOLD, PRIMARY_BLUE);

    private static final DateTimeFormatter DATE_FMT      = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATETIME_FMT   = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ═══════════════════════════════════════════════════════════════════════
    //  PUBLIC API — Journal Voucher PDF
    // ═══════════════════════════════════════════════════════════════════════

    public byte[] generateJournalEntryPdf(GlJournalEntryResponse entry) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 50);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new JournalVoucherFooter(entry.getVoucherNo()));
            document.open();

            addCompanyHeader(document, entry);
            addDocumentTitle(document);
            addMetadataRibbon(document, entry);
            addJournalTable(document, entry);
            addTotalsSection(document, entry);
            addNarrationSection(document, entry);
            addApprovalSection(document);

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate Journal Voucher PDF", ex);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 1 — Company Header
    // ═══════════════════════════════════════════════════════════════════════

    private void addCompanyHeader(Document document, GlJournalEntryResponse entry) throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{15f, 85f});

        // Logo placeholder cell
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBackgroundColor(HEADER_BG);
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setPadding(12);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        logoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        logoCell.setMinimumHeight(72);

        // Draw a placeholder logo icon (circle with initials)
        String companyName = safe(entry.getCompanyName(), "ERP Corporation");
        String initials = getInitials(companyName);
        Paragraph logoPara = new Paragraph();
        Font initialsFont = new Font(Font.HELVETICA, 20, Font.BOLD, HEADER_TEXT);
        Chunk initialsChunk = new Chunk(initials, initialsFont);
        logoPara.add(initialsChunk);
        logoPara.setAlignment(Element.ALIGN_CENTER);
        logoCell.addElement(logoPara);
        header.addCell(logoCell);

        // Company details cell
        PdfPCell detailCell = new PdfPCell();
        detailCell.setBackgroundColor(HEADER_BG);
        detailCell.setBorder(Rectangle.NO_BORDER);
        detailCell.setPadding(12);
        detailCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph namePara = new Paragraph(companyName, COMPANY_NAME_FONT);
        namePara.setSpacingAfter(3);
        detailCell.addElement(namePara);

        Paragraph addressPara = new Paragraph(
            safe(null, "123 Business Park, Financial District, Mumbai, Maharashtra 400001, India"),
            COMPANY_DETAIL_FONT
        );
        addressPara.setSpacingAfter(2);
        detailCell.addElement(addressPara);

        Paragraph gstPara = new Paragraph(
            "GSTIN: " + safe(null, "27AABCU9603R1ZM") + "  |  CIN: U74999MH2020PTC123456",
            COMPANY_GST_FONT
        );
        detailCell.addElement(gstPara);

        header.addCell(detailCell);
        document.add(header);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 2 — Document Title
    // ═══════════════════════════════════════════════════════════════════════

    private void addDocumentTitle(Document document) throws DocumentException {
        document.add(spacer(10));

        PdfPTable titleBar = new PdfPTable(1);
        titleBar.setWidthPercentage(100);

        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setPadding(0);
        titleCell.setPaddingBottom(8);
        titleCell.setBorderWidthBottom(2.5f);
        titleCell.setBorderColorBottom(ACCENT_BLUE);

        Paragraph title = new Paragraph("JOURNAL VOUCHER", TITLE_FONT);
        title.setAlignment(Element.ALIGN_LEFT);
        titleCell.addElement(title);

        Paragraph sub = new Paragraph("General Ledger  •  Double-Entry Accounting Document", SUBTITLE_FONT);
        titleCell.addElement(sub);

        titleBar.addCell(titleCell);
        document.add(titleBar);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 3 — Metadata Ribbon
    // ═══════════════════════════════════════════════════════════════════════

    private void addMetadataRibbon(Document document, GlJournalEntryResponse entry) throws DocumentException {
        document.add(spacer(10));

        PdfPTable meta = new PdfPTable(6);
        meta.setWidthPercentage(100);
        meta.setWidths(new float[]{17f, 17f, 17f, 17f, 16f, 16f});

        addMetadataField(meta, "VOUCHER NO.", safe(entry.getVoucherNo(), "JV-2026-000001"));
        addMetadataField(meta, "POSTING DATE",
                entry.getVoucherDate() != null ? entry.getVoucherDate().format(DATE_FMT) : LocalDate.now().format(DATE_FMT));
        addMetadataField(meta, "FISCAL YEAR", safe(entry.getFiscalYearValue(), "2025-2026"));
        addMetadataField(meta, "PERIOD", safe(entry.getPeriodName(), "June 2026"));
        addMetadataField(meta, "SOURCE", safe(entry.getSourceModule(), "MANUAL"));
        addStatusField(meta, entry);

        document.add(meta);
    }

    private void addMetadataField(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8);
        cell.setBackgroundColor(new Color(249, 250, 251));
        cell.setBorderWidthRight(0.5f);
        cell.setBorderColorRight(BORDER_COLOR);

        Paragraph labelPara = new Paragraph(label, LABEL_FONT);
        labelPara.setSpacingAfter(2);
        cell.addElement(labelPara);

        Paragraph valuePara = new Paragraph(value, VALUE_FONT);
        cell.addElement(valuePara);

        table.addCell(cell);
    }

    private void addStatusField(PdfPTable table, GlJournalEntryResponse entry) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8);
        cell.setBackgroundColor(new Color(249, 250, 251));

        Paragraph labelPara = new Paragraph("STATUS", LABEL_FONT);
        labelPara.setSpacingAfter(2);
        cell.addElement(labelPara);

        String statusText = entry.getStatus() != null ? entry.getStatus().name() : "DRAFT";
        Font statusFont = "POSTED".equalsIgnoreCase(statusText) ? STATUS_FONT_POSTED : STATUS_FONT_DRAFT;

        Chunk badge = new Chunk("● " + statusText, statusFont);
        Paragraph valuePara = new Paragraph();
        valuePara.add(badge);
        cell.addElement(valuePara);

        table.addCell(cell);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 4 — Journal Entry Table
    // ═══════════════════════════════════════════════════════════════════════

    private void addJournalTable(Document document, GlJournalEntryResponse entry) throws DocumentException {
        document.add(spacer(14));

        // Section label
        Paragraph sectionTitle = new Paragraph("JOURNAL ENTRY LINES", SECTION_FONT);
        sectionTitle.setSpacingAfter(6);
        document.add(sectionTitle);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{6f, 28f, 28f, 19f, 19f});
        table.setHeaderRows(1);

        // Column headers
        addTableHeaderCell(table, "#",            Element.ALIGN_CENTER);
        addTableHeaderCell(table, "DESCRIPTION",  Element.ALIGN_LEFT);
        addTableHeaderCell(table, "ACCOUNT",      Element.ALIGN_LEFT);
        addTableHeaderCell(table, "DEBIT (₹)",    Element.ALIGN_RIGHT);
        addTableHeaderCell(table, "CREDIT (₹)",   Element.ALIGN_RIGHT);

        // Data rows
        List<GlJournalLineResponse> lines = entry.getJournalLines();
        if (lines != null && !lines.isEmpty()) {
            int rowNum = 1;
            for (GlJournalLineResponse line : lines) {
                Color rowBg = (rowNum % 2 == 0) ? TABLE_ALT_ROW : TABLE_WHITE;
                addTableBodyCell(table, String.valueOf(rowNum), TABLE_BODY_FONT, Element.ALIGN_CENTER, rowBg);
                addTableBodyCell(table, safe(line.getLineDescription(), "—"), TABLE_BODY_FONT, Element.ALIGN_LEFT, rowBg);

                // Account: code + name
                String accountDisplay = "";
                if (line.getAccountCode() != null) {
                    accountDisplay = line.getAccountCode();
                }
                if (line.getAccountName() != null) {
                    accountDisplay += (accountDisplay.isEmpty() ? "" : " - ") + line.getAccountName();
                }
                if (accountDisplay.isEmpty()) {
                    accountDisplay = "—";
                }
                addTableBodyCell(table, accountDisplay, TABLE_BODY_BOLD_FONT, Element.ALIGN_LEFT, rowBg);

                // Debit
                if (line.getDebitAmount() != null && line.getDebitAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addAmountCell(table, formatAmount(line.getDebitAmount()), DEBIT_FONT, rowBg);
                } else {
                    addAmountCell(table, "—", AMOUNT_FONT, rowBg);
                }

                // Credit
                if (line.getCreditAmount() != null && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addAmountCell(table, formatAmount(line.getCreditAmount()), CREDIT_FONT, rowBg);
                } else {
                    addAmountCell(table, "—", AMOUNT_FONT, rowBg);
                }

                rowNum++;
            }
        } else {
            // Empty state
            PdfPCell emptyCell = new PdfPCell(new Phrase("No journal lines available", TABLE_BODY_FONT));
            emptyCell.setColspan(5);
            emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            emptyCell.setPadding(20);
            emptyCell.setBorderColor(BORDER_COLOR);
            table.addCell(emptyCell);
        }

        document.add(table);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 5 — Totals Section
    // ═══════════════════════════════════════════════════════════════════════

    private void addTotalsSection(Document document, GlJournalEntryResponse entry) throws DocumentException {
        PdfPTable totals = new PdfPTable(5);
        totals.setWidthPercentage(100);
        totals.setWidths(new float[]{6f, 28f, 28f, 19f, 19f});

        // Spacer cells
        PdfPCell spacerCell = new PdfPCell(new Phrase(""));
        spacerCell.setColspan(3);
        spacerCell.setBackgroundColor(TOTAL_DARK_BG);
        spacerCell.setBorder(Rectangle.NO_BORDER);
        spacerCell.setPadding(10);

        Paragraph totalLabel = new Paragraph("TOTAL", TOTAL_LABEL_FONT);
        totalLabel.setAlignment(Element.ALIGN_RIGHT);
        spacerCell.addElement(totalLabel);
        totals.addCell(spacerCell);

        // Total Debit
        PdfPCell debitTotalCell = new PdfPCell();
        debitTotalCell.setBackgroundColor(TOTAL_DARK_BG);
        debitTotalCell.setBorder(Rectangle.NO_BORDER);
        debitTotalCell.setPadding(10);
        debitTotalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph debitTotal = new Paragraph(
            "₹ " + formatAmount(entry.getTotalDebit() != null ? entry.getTotalDebit() : BigDecimal.ZERO),
            TOTAL_AMOUNT_FONT
        );
        debitTotal.setAlignment(Element.ALIGN_RIGHT);
        debitTotalCell.addElement(debitTotal);
        totals.addCell(debitTotalCell);

        // Total Credit
        PdfPCell creditTotalCell = new PdfPCell();
        creditTotalCell.setBackgroundColor(TOTAL_DARK_BG);
        creditTotalCell.setBorder(Rectangle.NO_BORDER);
        creditTotalCell.setPadding(10);
        creditTotalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph creditTotal = new Paragraph(
            "₹ " + formatAmount(entry.getTotalCredit() != null ? entry.getTotalCredit() : BigDecimal.ZERO),
            TOTAL_AMOUNT_FONT
        );
        creditTotal.setAlignment(Element.ALIGN_RIGHT);
        creditTotalCell.addElement(creditTotal);
        totals.addCell(creditTotalCell);

        document.add(totals);

        // Balance check bar
        boolean isBalanced = entry.getIsBalanced() != null && entry.getIsBalanced();
        PdfPTable balanceBar = new PdfPTable(1);
        balanceBar.setWidthPercentage(100);

        PdfPCell balanceCell = new PdfPCell();
        balanceCell.setBorder(Rectangle.NO_BORDER);
        balanceCell.setPadding(5);
        Color balanceBg = isBalanced ? new Color(220, 252, 231) : new Color(254, 226, 226);
        Color balanceTextColor = isBalanced ? new Color(5, 122, 85) : new Color(185, 28, 28);
        balanceCell.setBackgroundColor(balanceBg);

        Font balanceFont = new Font(Font.HELVETICA, 8, Font.BOLD, balanceTextColor);
        String balanceText = isBalanced ? "✓  Entry is balanced — Debit equals Credit" : "✗  Entry is NOT balanced — Please review";
        Paragraph balancePara = new Paragraph(balanceText, balanceFont);
        balancePara.setAlignment(Element.ALIGN_CENTER);
        balanceCell.addElement(balancePara);
        balanceBar.addCell(balanceCell);

        document.add(balanceBar);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 6 — Narration
    // ═══════════════════════════════════════════════════════════════════════

    private void addNarrationSection(Document document, GlJournalEntryResponse entry) throws DocumentException {
        document.add(spacer(14));

        PdfPTable narrationTable = new PdfPTable(1);
        narrationTable.setWidthPercentage(100);

        // Title cell
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBackgroundColor(new Color(243, 244, 246));
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setBorderWidthBottom(0.5f);
        titleCell.setBorderColorBottom(BORDER_COLOR);
        titleCell.setPadding(8);
        titleCell.addElement(new Paragraph("NARRATION / REMARKS", NARRATION_LABEL_FONT));
        narrationTable.addCell(titleCell);

        // Body cell
        PdfPCell bodyCell = new PdfPCell();
        bodyCell.setBackgroundColor(NARRATION_BG);
        bodyCell.setBorder(Rectangle.NO_BORDER);
        bodyCell.setPadding(10);
        bodyCell.setMinimumHeight(40);

        String narrationText = safe(entry.getNarration(), "Being journal entry recorded for the transaction as described above.");
        bodyCell.addElement(new Paragraph(narrationText, NARRATION_BODY_FONT));

        // Reference info
        if (entry.getReferenceNo() != null && !entry.getReferenceNo().isEmpty()) {
            Paragraph refPara = new Paragraph();
            refPara.setSpacingBefore(6);
            Font refLabelFont = new Font(Font.HELVETICA, 7.5f, Font.BOLD, LABEL_GRAY);
            Font refValueFont = new Font(Font.HELVETICA, 7.5f, Font.NORMAL, VALUE_DARK);
            refPara.add(new Chunk("Reference No: ", refLabelFont));
            refPara.add(new Chunk(entry.getReferenceNo(), refValueFont));
            bodyCell.addElement(refPara);
        }

        narrationTable.addCell(bodyCell);
        document.add(narrationTable);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 7 — Approval Section
    // ═══════════════════════════════════════════════════════════════════════

    private void addApprovalSection(Document document) throws DocumentException {
        document.add(spacer(24));

        PdfPTable approvalTable = new PdfPTable(4);
        approvalTable.setWidthPercentage(100);
        approvalTable.setWidths(new float[]{25f, 25f, 25f, 25f});

        addSignatureBlock(approvalTable, "Prepared By", "Accounts Executive");
        addSignatureBlock(approvalTable, "Checked By", "Senior Accountant");
        addSignatureBlock(approvalTable, "Approved By", "Finance Manager");
        addSignatureBlock(approvalTable, "Authorized Signature", "Director / CFO");

        document.add(approvalTable);
    }

    private void addSignatureBlock(PdfPTable table, String title, String designation) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(10);
        cell.setPaddingTop(0);

        // Signature line
        PdfPTable innerTable = new PdfPTable(1);
        innerTable.setWidthPercentage(100);

        PdfPCell lineCell = new PdfPCell();
        lineCell.setBorder(Rectangle.NO_BORDER);
        lineCell.setMinimumHeight(45);
        lineCell.setBorderWidthBottom(1f);
        lineCell.setBorderColorBottom(SIGNATURE_LINE);
        innerTable.addCell(lineCell);

        PdfPCell titleCellInner = new PdfPCell(new Phrase(title, SIGNATURE_TITLE_FONT));
        titleCellInner.setBorder(Rectangle.NO_BORDER);
        titleCellInner.setPaddingTop(4);
        titleCellInner.setHorizontalAlignment(Element.ALIGN_CENTER);
        innerTable.addCell(titleCellInner);

        PdfPCell desigCell = new PdfPCell(new Phrase(designation, SIGNATURE_LABEL_FONT));
        desigCell.setBorder(Rectangle.NO_BORDER);
        desigCell.setPaddingTop(1);
        desigCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        innerTable.addCell(desigCell);

        cell.addElement(innerTable);
        table.addCell(cell);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SECTION 8 — Footer (Page Event)
    // ═══════════════════════════════════════════════════════════════════════

    private static class JournalVoucherFooter extends PdfPageEventHelper {

        private final String voucherNo;

        JournalVoucherFooter(String voucherNo) {
            this.voucherNo = voucherNo != null ? voucherNo : "";
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float pageWidth = document.right() - document.left();
            float x = document.left();
            float y = document.bottom() - 20;

            // Separator line
            cb.setColorStroke(BORDER_COLOR);
            cb.setLineWidth(0.5f);
            cb.moveTo(x, y + 12);
            cb.lineTo(x + pageWidth, y + 12);
            cb.stroke();

            Font footerFont = new Font(Font.HELVETICA, 7, Font.NORMAL, FOOTER_GRAY);
            Font footerBoldFont = new Font(Font.HELVETICA, 7, Font.BOLD, FOOTER_GRAY);

            // Left: Generated by ERP System
            Phrase leftPhrase = new Phrase();
            leftPhrase.add(new Chunk("Generated by ", footerFont));
            leftPhrase.add(new Chunk("ERP Accounting System", footerBoldFont));
            leftPhrase.add(new Chunk("  •  " + voucherNo, footerFont));
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, leftPhrase, x, y, 0);

            // Center: Timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm:ss a"));
            Phrase centerPhrase = new Phrase(timestamp, footerFont);
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, centerPhrase, x + (pageWidth / 2), y, 0);

            // Right: Page number
            int pageNumber = writer.getPageNumber();
            Phrase rightPhrase = new Phrase("Page " + pageNumber, footerBoldFont);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, rightPhrase, x + pageWidth, y, 0);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  Helper Methods
    // ═══════════════════════════════════════════════════════════════════════

    private void addTableHeaderCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_HEADER_FONT));
        cell.setBackgroundColor(TABLE_HEADER);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8);
        cell.setPaddingTop(9);
        cell.setPaddingBottom(9);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private void addTableBodyCell(PdfPTable table, String text, Font font, int alignment, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBorderWidthBottom(0.5f);
        cell.setBorderColorBottom(BORDER_COLOR);
        cell.setPadding(7);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private void addAmountCell(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBorderWidthBottom(0.5f);
        cell.setBorderColorBottom(BORDER_COLOR);
        cell.setPadding(7);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private static String formatAmount(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%,.2f", amount);
    }

    private static String safe(String value, String fallback) {
        return (value != null && !value.isEmpty()) ? value : fallback;
    }

    private static String getInitials(String name) {
        if (name == null || name.isEmpty()) return "E";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        return (parts[0].charAt(0) + "" + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    private static Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingBefore(height);
        return p;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  BACKWARD-COMPATIBLE METHODS (existing API contract)
    // ═══════════════════════════════════════════════════════════════════════

    public byte[] generateTrialBalancePdf(List<TrialBalanceLine> lines) {
        return generateSimplePdfDocument("Trial Balance", buildTrialBalanceBody(lines));
    }

    public byte[] generateGeneralLedgerPdf(List<GeneralLedgerLine> ledgerLines) {
        return generateSimplePdfDocument("General Ledger", buildGeneralLedgerBody(ledgerLines));
    }

    public byte[] generateBalanceSheetPdf(BalanceSheetReport report) {
        return generateSimplePdfDocument("Balance Sheet", buildBalanceSheetBody(report));
    }

    public byte[] generateProfitLossPdf(ProfitLossReport report) {
        return generateSimplePdfDocument("Profit & Loss", buildProfitLossBody(report));
    }

    private byte[] generateSimplePdfDocument(String title, String body) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, outputStream);
            document.open();
            document.add(new Paragraph(title));
            document.add(new Paragraph("\n"));
            document.add(new Paragraph(body));
            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate PDF document", ex);
        }
    }

    private String buildTrialBalanceBody(List<TrialBalanceLine> lines) {
        StringBuilder builder = new StringBuilder();
        builder.append("Account Code | Account Name | Opening | Debit | Credit | Closing\n");
        lines.forEach(line -> builder.append(line.getAccountCode()).append(" | ").append(line.getAccountName())
                .append(" | ").append(line.getOpeningBalance()).append(" | ").append(line.getDebitAmount())
                .append(" | ").append(line.getCreditAmount()).append(" | ").append(line.getClosingBalance())
                .append("\n"));
        return builder.toString();
    }

    private String buildGeneralLedgerBody(List<GeneralLedgerLine> ledgerLines) {
        StringBuilder builder = new StringBuilder();
        builder.append("Voucher | Date | Debit | Credit | Running Balance | Narration\n");
        ledgerLines.forEach(line -> builder.append(line.getVoucherNo()).append(" | ").append(line.getVoucherDate())
                .append(" | ").append(line.getDebitAmount()).append(" | ").append(line.getCreditAmount())
                .append(" | ").append(line.getRunningBalance()).append(" | ").append(line.getNarration())
                .append("\n"));
        return builder.toString();
    }

    private String buildBalanceSheetBody(BalanceSheetReport report) {
        return "Total Assets: " + report.getTotalAssets() + "\n" + "Total Liabilities: " + report.getTotalLiabilities()
                + "\n" + "Total Equity: " + report.getTotalEquity() + "\n" + "Assets + Equity: "
                + report.getTotalAssetsAndEquity();
    }

    private String buildProfitLossBody(ProfitLossReport report) {
        return "Total Income: " + report.getTotalIncome() + "\n" + "Total Expenses: " + report.getTotalExpenses()
                + "\n" + "Net Profit/Loss: " + report.getNetProfitOrLoss();
    }
}
