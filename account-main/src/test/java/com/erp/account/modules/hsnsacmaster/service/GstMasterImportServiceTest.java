package com.erp.account.modules.hsnsacmaster.service;

import com.erp.account.modules.gstslab.repository.GstSlabRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
public class GstMasterImportServiceTest {

    @Mock
    private GstSlabRepository gstSlabRepository;

    @Mock
    private HsnSacMasterRepository hsnSacMasterRepository;

    @InjectMocks
    private GstMasterImportService gstMasterImportService;

    @Test
    void testImportMasterData_FileNotFound() {
        assertDoesNotThrow(() -> {
            gstMasterImportService.importMasterData("NonExistentFile.xlsx");
        });
    }

    @Test
    void testImportMasterData_SuccessWithEmptyDB() {
        File tempFile = null;
        try {
            // We are just verifying it handles empty file gracefully without crashing,
            // Testing full POI parsing usually requires a mock XLSX in resources.
            tempFile = File.createTempFile("mock_hsn", ".xlsx");
            File finalTempFile = tempFile;
            assertDoesNotThrow(() -> {
                gstMasterImportService.importMasterData(finalTempFile.getAbsolutePath());
            });
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}
