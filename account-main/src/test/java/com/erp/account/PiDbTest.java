package com.erp.account;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class PiDbTest {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/account";
        String user = "postgres";
        String password = "mohit";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            String query = "SELECT id, pi_number, company_id, source_quotation_id, status, is_deleted, created_at FROM proforma_invoice WHERE source_quotation_id = 'ac27cee0-5db6-4c75-9b11-130e77e947e5'";
            ResultSet rs = stmt.executeQuery(query);

            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.println("--- DB RECORD FOUND ---");
                System.out.println("ID: " + rs.getString("id"));
                System.out.println("PI Number: " + rs.getString("pi_number"));
                System.out.println("Company ID: " + rs.getString("company_id"));
                System.out.println("Source Quotation ID: " + rs.getString("source_quotation_id"));
                System.out.println("Status: " + rs.getString("status"));
                System.out.println("Is Deleted: " + rs.getBoolean("is_deleted") + " (wasNull: " + rs.wasNull() + ")");
                System.out.println("Created At: " + rs.getString("created_at"));
            }

            if (!found) {
                System.out.println("NO PI FOUND FOR QUOTATION ID ac27cee0-5db6-4c75-9b11-130e77e947e5");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
