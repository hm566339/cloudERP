package com.erp.account.modules.gst.service;

import com.erp.account.modules.common.entity.Country;
import com.erp.account.modules.common.repository.CountryRepository;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GstStateMasterBootstrap implements ApplicationRunner {

    private final GstStateCodeRepository gstStateCodeRepository;
    private final CountryRepository countryRepository;

    private static final String EXCEL_PATH = "master-data/gst-state-master.xlsx";
    private static final String COUNTRY_CODE_IN = "IN";

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("========================================");
        log.info("GST STATE MASTER BOOTSTRAP");
        log.info("========================================");

        try (InputStream is = new ClassPathResource(EXCEL_PATH).getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<ExcelStateRecord> excelRecords = new ArrayList<>();

            // Start from row 1 (assuming row 0 is header)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String stateName = getCellValueAsString(row.getCell(1));
                String gstinFirstTwoDigit = getCellValueAsString(row.getCell(2));
                String stateCodeShort = getCellValueAsString(row.getCell(3));

                if (stateName == null || stateName.trim().isEmpty() ||
                        gstinFirstTwoDigit == null || gstinFirstTwoDigit.trim().isEmpty()) {
                    if (stateName == null && gstinFirstTwoDigit == null) continue; // empty row
                    throw new IllegalArgumentException("Validation failed at row " + (i + 1) +
                            ": STATE NAME or GSTIN First Two Digit is blank.");
                }

                // Ensure gstinFirstTwoDigit is valid and padded to 2 digits
                try {
                    int code = Integer.parseInt(gstinFirstTwoDigit.trim());
                    gstinFirstTwoDigit = String.format("%02d", code);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Validation failed at row " + (i + 1) +
                            ": GSTIN First Two Digit must be numeric. Found: " + gstinFirstTwoDigit);
                }

                if (stateCodeShort == null || stateCodeShort.trim().isEmpty()) {
                    throw new IllegalArgumentException("Validation failed at row " + (i + 1) +
                            ": STATE CODE must not be blank.");
                }

                excelRecords.add(new ExcelStateRecord(stateName.trim(), gstinFirstTwoDigit, stateCodeShort.trim()));
            }

            // Validations
            if (excelRecords.size() != 37) {
                log.warn("Expected 37 records in Excel, but found: " + excelRecords.size());
            }

            Set<String> uniqueCodes = new HashSet<>();
            for (ExcelStateRecord record : excelRecords) {
                if (!uniqueCodes.add(record.gstinFirstTwoDigit)) {
                    throw new IllegalArgumentException("Validation failed: Duplicate state code found in Excel: " + record.gstinFirstTwoDigit);
                }
            }

            // Sync with DB
            Country india = countryRepository.findByCountryCodeIgnoreCase(COUNTRY_CODE_IN).orElseGet(() -> {
                Country newCountry = Country.builder()
                        .countryCode(COUNTRY_CODE_IN)
                        .countryName("India")
                        .isoCountryCode("IND")
                        .build();
                return countryRepository.save(newCountry);
            });

            List<GstStateCode> existingStates = gstStateCodeRepository.findAll();
            Map<String, GstStateCode> byCode = existingStates.stream()
                    .collect(Collectors.toMap(
                            s -> s.getStateCode(),
                            s -> s,
                            (existing, replacement) -> existing
                    ));

            Map<String, GstStateCode> byName = existingStates.stream()
                    .collect(Collectors.toMap(
                            s -> s.getStateName().trim().toUpperCase(),
                            s -> s,
                            (existing, replacement) -> existing
                    ));

            int inserted = 0;
            int updated = 0;
            int skipped = 0;

            for (ExcelStateRecord record : excelRecords) {
                String key = record.gstinFirstTwoDigit;
                String nameKey = record.stateName.trim().toUpperCase();
                
                GstStateCode existing = byCode.get(key);
                
                // If not found by code, try finding by state name (handling the incorrect code case)
                if (existing == null) {
                    existing = byName.get(nameKey);
                }

                if (existing != null) {
                    boolean changed = false;
                    
                    if (Boolean.TRUE.equals(existing.getIsDeleted())) {
                        existing.setIsDeleted(false);
                        changed = true;
                    }
                    
                    if (existing.getCountry() == null) {
                        existing.setCountry(india);
                        changed = true;
                    }

                    if (!existing.getStateCode().equals(record.gstinFirstTwoDigit)) {
                        log.info("GST State Bootstrap: Updated {}: stateCode {} -> {}", record.stateName, existing.getStateCode(), record.gstinFirstTwoDigit);
                        existing.setStateCode(record.gstinFirstTwoDigit);
                        changed = true;
                    }
                    
                    if (existing.getShortName() == null || !existing.getShortName().equals(record.stateCodeShort)) {
                        existing.setShortName(record.stateCodeShort);
                        changed = true;
                    }
                    
                    String displayName = record.gstinFirstTwoDigit + " - " + record.stateName;
                    if (existing.getDisplayName() == null || !existing.getDisplayName().equals(displayName)) {
                        existing.setDisplayName(displayName);
                        changed = true;
                    }

                    if (!existing.getStateName().equals(record.stateName)) {
                        existing.setStateName(record.stateName);
                        changed = true;
                    }

                    if (changed) {
                        gstStateCodeRepository.save(existing);
                        updated++;
                    } else {
                        skipped++;
                    }
                } else {
                    GstStateCode newState = GstStateCode.builder()
                            .stateCode(record.gstinFirstTwoDigit)
                            .stateName(record.stateName)
                            .shortName(record.stateCodeShort)
                            .displayName(record.gstinFirstTwoDigit + " - " + record.stateName)
                            .country(india)
                            // isUnionTerritory defaults to false if not specified
                            .isUnionTerritory(false)
                            .build();

                    gstStateCodeRepository.save(newState);
                    inserted++;
                }
            }

            log.info("Excel records found: {}", excelRecords.size());
            log.info("Existing database records: {}", existingStates.size());
            log.info("Records inserted: {}", inserted);
            log.info("Records updated: {}", updated);
            log.info("Records skipped: {}", skipped);
            log.info("Errors: {}", 0);
            
            if (inserted == 0 && updated == 0) {
                log.info("No changes required.");
            } else {
                log.info("GST State Master bootstrap completed successfully.");
            }
            log.info("========================================");
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue();
        } else if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toString();
            } else {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    return String.valueOf((long) val);
                }
                return String.valueOf(val);
            }
        } else if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }
        return null;
    }

    private static class ExcelStateRecord {
        String stateName;
        String gstinFirstTwoDigit;
        String stateCodeShort;

        public ExcelStateRecord(String stateName, String gstinFirstTwoDigit, String stateCodeShort) {
            this.stateName = stateName;
            this.gstinFirstTwoDigit = gstinFirstTwoDigit;
            this.stateCodeShort = stateCodeShort;
        }
    }
}
