package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.reporting.dto.ReportExportData;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class CsvGenerator {

    public void generate(ReportExportData data, OutputStream outputStream) throws IOException {
        try (PrintWriter writer = new PrintWriter(outputStream, true, StandardCharsets.UTF_8)) {
            // Write BOM for Excel compatibility with UTF-8 CSV
            outputStream.write(0xEF);
            outputStream.write(0xBB);
            outputStream.write(0xBF);

            // Headers
            if (data.getHeaders() != null) {
                writer.println(String.join(",", escape(data.getHeaders())));
            }

            // Rows
            if (data.getRows() != null) {
                for (var row : data.getRows()) {
                    writer.println(String.join(",", escape(row.stream().map(val -> val == null ? "" : String.valueOf(val)).toList())));
                }
            }
        }
    }

    private List<String> escape(List<String> values) {
        return values.stream().map(v -> {
            if (v == null) return "";
            if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
                return "\"" + v.replace("\"", "\"\"") + "\"";
            }
            return v;
        }).toList();
    }
}
