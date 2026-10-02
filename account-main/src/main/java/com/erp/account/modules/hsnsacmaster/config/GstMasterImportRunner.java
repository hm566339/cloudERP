package com.erp.account.modules.hsnsacmaster.config;

import com.erp.account.modules.gstslab.repository.GstSlabRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.hsnsacmaster.service.GstMasterImportService;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class GstMasterImportRunner implements CommandLineRunner {

    private final GstSlabRepository gstSlabRepository;
    private final HsnSacMasterRepository hsnSacMasterRepository;
    private final GstMasterImportService gstMasterImportService;
    private final JdbcTemplate jdbcTemplate;

    // Fixed path provided by the user for import
    private static final String EXCEL_FILE_PATH = "Sales_MT_2026-27_592.xlsx";

    @Override
    public void run(String... args) throws Exception {
        log.info("Fixing any invalid HSN/SAC Types in Database...");
        int rowsFixed = jdbcTemplate.update("UPDATE hsn_sac_master SET type = CASE WHEN code LIKE '99%' THEN 'SAC' ELSE 'HSN' END WHERE type NOT IN ('HSN', 'SAC')");
        if (rowsFixed > 0) {
            log.info("Fixed {} invalid HSN/SAC type records in the database.", rowsFixed);
        }

        long slabCount = gstSlabRepository.count();
        long hsnCount = hsnSacMasterRepository.count();

        if (slabCount > 0 && hsnCount > 0) {
            log.info("GST Master already exists.\nSkipping Excel import.");
            return;
        }

        log.info("GST Slabs Found: {}", slabCount);
        log.info("HSN Records Found: {}", hsnCount);

        File file = new File(EXCEL_FILE_PATH);
        if (file.exists()) {
            gstMasterImportService.importMasterData(EXCEL_FILE_PATH);
        } else {
            log.warn("GST Master Excel file not found at {}. Cannot run import.", file.getAbsolutePath());
        }
    }
}
