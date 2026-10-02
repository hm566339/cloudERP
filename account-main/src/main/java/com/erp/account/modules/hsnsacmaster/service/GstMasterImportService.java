package com.erp.account.modules.hsnsacmaster.service;

import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.gstslab.repository.GstSlabRepository;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GstMasterImportService {

    private final GstSlabRepository gstSlabRepository;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final EntityManager entityManager;

    private static final int BATCH_SIZE = 500;

    @Transactional(rollbackFor = Exception.class)
    public void importMasterData(String filePath) {
        log.info("\n====================================\n" +
                 "GST MASTER IMPORT STARTED\n" +
                 "====================================");

        File file = new File(filePath);
        if (!file.exists()) {
            log.error("Excel file not found at path: {}", filePath);
            return;
        }

        long existingSlabsCount = gstSlabRepository.count();
        long existingHsnCount = hsnSacMasterRepository.count();

        if (existingSlabsCount > 0 && existingHsnCount > 0) {
            return; // Handled by runner logging
        }

        log.info("\nExcel File Found\n\nReading Sheet...\n");

        // Configure ZipSecureFile for trusted files
        ZipSecureFile.setMinInflateRatio(0.001);

        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(fis)) {

            Sheet sheet = findSheet(workbook);
            if (sheet == null) {
                log.error("Could not find a valid sheet containing 'HSN Code'.");
                return;
            }

            Map<String, Integer> headerMap = new HashMap<>();
            int headerRowIndex = -1;

            // Find headers up to row 20
            for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 20); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                for (Cell cell : row) {
                    if (cell.getCellType() == CellType.STRING) {
                        String val = cell.getStringCellValue().trim().toLowerCase();
                        if (val.contains("hsn") || val.contains("sac")) {
                            headerRowIndex = i;
                            break;
                        }
                    }
                }
                if (headerRowIndex != -1) break;
            }

            if (headerRowIndex == -1) {
                log.error("Could not find HSN/SAC column in the first 20 rows.");
                return;
            }

            Row headerRow = sheet.getRow(headerRowIndex);
            
            // Hardcode column indexes based on the specific Tally export format if we can't find them by name
            int hsnIdx = 5; // HSN/SAC
            int descIdx = 0; // Particulars
            int rateIdx = 3; // GST
            int typeIdx = 2; // Taxability
            
            // Let's try to detect them dynamically just in case
            for (Cell cell : headerRow) {
                if (cell.getCellType() == CellType.STRING) {
                    String headerName = cell.getStringCellValue().trim().toLowerCase();
                    if (headerName.contains("particular") || headerName.contains("description")) {
                        descIdx = cell.getColumnIndex();
                    } else if (headerName.contains("hsn") || headerName.contains("sac")) {
                        hsnIdx = cell.getColumnIndex();
                    } else if (headerName.contains("gst") || headerName.contains("rate")) {
                        rateIdx = cell.getColumnIndex();
                    } else if (headerName.contains("taxability")) {
                        typeIdx = cell.getColumnIndex();
                    }
                }
            }

            Map<String, GstSlab> slabCache = new HashMap<>();
            List<GstSlab> existingSlabs = gstSlabRepository.findAll();
            for (GstSlab slab : existingSlabs) {
                if (slab.getSlabName() != null) {
                    slabCache.put(slab.getSlabName().trim().toLowerCase(), slab);
                }
            }

            int importedSlabsCount = 0;
            int skippedSlabsCount = 0;
            int importedHsnCount = 0;
            int skippedHsnCount = 0;
            int batchCount = 0;

            for (int i = headerRowIndex + 2; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String hsnCode = getCellValueAsString(row.getCell(hsnIdx));
                    if (hsnCode == null || hsnCode.isEmpty()) continue;

                    String description = getCellValueAsString(row.getCell(descIdx));
                    if (description == null || description.isEmpty()) {
                        description = "HSN " + hsnCode;
                    }
                    
                    String rateStr = getCellValueAsString(row.getCell(rateIdx));
                    String type = "HSN";
                    if (hsnCode.startsWith("99")) {
                        type = "SAC";
                    }

                    if (rateStr == null || rateStr.isEmpty() || rateStr.equalsIgnoreCase("-") || rateStr.equalsIgnoreCase("nil")) {
                        rateStr = "0";
                    }
                    
                    rateStr = rateStr.replace("%", "").trim();
                    BigDecimal igstRate;
                    try {
                        igstRate = new BigDecimal(rateStr).stripTrailingZeros();
                    } catch (Exception e) {
                        log.warn("Row {} : Invalid GST Rate '{}'. Defaulting to 0.", i, rateStr);
                        igstRate = BigDecimal.ZERO;
                    }

                    String slabName = "GST " + igstRate.stripTrailingZeros().toPlainString() + "%";
                    String slabKey = slabName.toLowerCase();

                    // Get or Create Slab by Name
                    GstSlab slab = slabCache.get(slabKey);
                    if (slab == null) {
                        BigDecimal halfRate = igstRate.divide(BigDecimal.valueOf(2));
                        slab = GstSlab.builder()
                                .slabName(slabName)
                                .igstRate(igstRate)
                                .cgstRate(halfRate)
                                .sgstRate(halfRate)
                                .cessRate(BigDecimal.ZERO)
                                .effectiveFrom(LocalDate.of(2017, 7, 1))
                                .build();
                        slab = gstSlabRepository.save(slab);
                        slabCache.put(slabKey, slab);
                        importedSlabsCount++;
                    } else {
                        // Update if exists
                        BigDecimal halfRate = igstRate.divide(BigDecimal.valueOf(2));
                        slab.setIgstRate(igstRate);
                        slab.setCgstRate(halfRate);
                        slab.setSgstRate(halfRate);
                        slab = gstSlabRepository.save(slab);
                        skippedSlabsCount++;
                    }

                    Optional<HsnSacMaster> existingHsn = hsnSacMasterRepository.findByCodeIgnoreCaseAndIsDeletedFalse(hsnCode);
                    HsnSacMaster hsn;
                    if (existingHsn.isPresent()) {
                        hsn = existingHsn.get();
                        hsn.setDescription(description);
                        hsn.setGstSlab(slab);
                        skippedHsnCount++; // It's an update, so it skips creating a new duplicate
                    } else {
                        hsn = HsnSacMaster.builder()
                                .code(hsnCode)
                                .description(description)
                                .type(type)
                                .gstSlab(slab)
                                .build();
                        importedHsnCount++;
                    }
                    
                    hsnSacMasterRepository.save(hsn);
                    batchCount++;

                    if (batchCount % BATCH_SIZE == 0) {
                        entityManager.flush();
                        entityManager.clear();
                        
                        slabCache.clear();
                        List<GstSlab> reloadedSlabs = gstSlabRepository.findAll();
                        for (GstSlab s : reloadedSlabs) {
                            if (s.getSlabName() != null) {
                                slabCache.put(s.getSlabName().trim().toLowerCase(), s);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("\nRow {}\n{}", i, e.getMessage());
                }
            }

            entityManager.flush();
            entityManager.clear();

            log.info("\nGST Slabs Imported : {}\n\n" +
                     "HSN Imported : {}\n\n" +
                     "Duplicates Updated : {}\n\n" +
                     "Completed Successfully\n\n" +
                     "====================================", 
                     importedSlabsCount, importedHsnCount, (skippedHsnCount + skippedSlabsCount));

        } catch (Exception e) {
            log.error("Failed to import GST Master Data: {}", e.getMessage());
        }
    }

    private Sheet findSheet(Workbook workbook) {
        for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
            Sheet sheet = workbook.getSheetAt(s);
            for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 20); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                for (Cell cell : row) {
                    if (cell.getCellType() == CellType.STRING) {
                        String val = cell.getStringCellValue().trim().toLowerCase();
                        if (val.contains("hsn") || val.contains("sac")) {
                            return sheet;
                        }
                    }
                }
            }
        }
        return null;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    return String.valueOf((long) val);
                }
                return String.valueOf(val);
            default:
                return null;
        }
    }
}
