package com.erp.account.util;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.entity.ApInvoice;


/**
 * Helper class for invoice aging report generation.
 *
 * Provides:
 * - Aging bucket classification
 * - Aging summary calculations
 * - Days overdue calculations
 * - Aging distribution analysis
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class AgingReportHelper {

    // ============================================================
    // AGING BUCKET
    // ============================================================

    @Getter
    public static class AgingBucket {

        private final String name;
        private final int minDays;
        private final int maxDays;

        private BigDecimal totalAmount;
        private long count;

        public AgingBucket(String name, int minDays, int maxDays) {
            this.name = name;
            this.minDays = minDays;
            this.maxDays = maxDays;
            this.totalAmount = BigDecimal.ZERO;
            this.count = 0;
        }

        public void addAmount(BigDecimal amount) {
            if (amount != null) {
                this.totalAmount = this.totalAmount.add(amount);
            }
        }

        public void incrementCount() {
            this.count++;
        }
    }

    // ============================================================
    // AGING BUCKET DEFINITIONS
    // ============================================================

    public static final AgingBucket BUCKET_0_30 = new AgingBucket("0-30 Days", 0, 30);

    public static final AgingBucket BUCKET_31_60 = new AgingBucket("31-60 Days", 31, 60);

    public static final AgingBucket BUCKET_61_90 = new AgingBucket("61-90 Days", 61, 90);

    public static final AgingBucket BUCKET_90_PLUS = new AgingBucket("90+ Days", 91, Integer.MAX_VALUE);

    // ============================================================
    // AGING CALCULATIONS
    // ============================================================

    /**
     * Calculate days overdue for an invoice.
     *
     * @param dueDate  Invoice due date
     * @param asOfDate Reference date
     * @return Days overdue (0 if not overdue)
     */
    public static int calculateDaysOverdue(LocalDate dueDate, LocalDate asOfDate) {

        if (dueDate == null || asOfDate == null) {
            return 0;
        }

        if (asOfDate.isBefore(dueDate)) {
            return 0;
        }

        return (int) ChronoUnit.DAYS.between(dueDate, asOfDate);
    }

    /**
     * Classify invoice into aging bucket.
     *
     * @param daysOverdue Days overdue
     * @return Aging bucket name
     */
    public static String classifyIntoAgingBucket(int daysOverdue) {

        if (daysOverdue <= 30) {
            return "0-30 Days";
        } else if (daysOverdue <= 60) {
            return "31-60 Days";
        } else if (daysOverdue <= 90) {
            return "61-90 Days";
        }

        return "90+ Days";
    }

    /**
     * Get aging bucket for given days.
     *
     * @param days Days overdue
     * @return AgingBucket
     */
    public static AgingBucket getAgingBucket(int days) {

        if (days <= 30) {
            return BUCKET_0_30;
        } else if (days <= 60) {
            return BUCKET_31_60;
        } else if (days <= 90) {
            return BUCKET_61_90;
        }

        return BUCKET_90_PLUS;
    }

    // ============================================================
    // AGING ANALYSIS
    // ============================================================

    /**
     * Generate aging summary for invoices.
     *
     * @param invoices List of invoices
     * @param asOfDate Reference date
     * @return Aging summary map
     */
    public static Map<String, AgingBucketSummary> generateAgingSummary(
            List<ApInvoiceResponse> invoices,
            LocalDate asOfDate) {

        Map<String, AgingBucketSummary> agingSummary = new HashMap<>();

        agingSummary.put("0-30 Days",
                new AgingBucketSummary("0-30 Days", 0, 30));

        agingSummary.put("31-60 Days",
                new AgingBucketSummary("31-60 Days", 31, 60));

        agingSummary.put("61-90 Days",
                new AgingBucketSummary("61-90 Days", 61, 90));

        agingSummary.put("90+ Days",
                new AgingBucketSummary("90+ Days", 91, Integer.MAX_VALUE));

        if (invoices == null || invoices.isEmpty()) {
            return agingSummary;
        }

        for (ApInvoiceResponse invoice : invoices) {

            int daysOverdue = calculateDaysOverdue(invoice.getDueDate(), asOfDate);

            String bucketName = classifyIntoAgingBucket(daysOverdue);

            AgingBucketSummary bucket = agingSummary.get(bucketName);

            if (bucket != null) {

                BigDecimal outstanding = invoice.getOutstandingAmount() != null
                        ? invoice.getOutstandingAmount()
                        : BigDecimal.ZERO;

                bucket.addAmount(outstanding);
                bucket.incrementCount();
            }
        }

        return agingSummary;
    }

    /**
     * Calculate total outstanding amount.
     *
     * @param agingSummary Aging summary
     * @return Total outstanding amount
     */
    public static BigDecimal calculateTotalOutstanding(
            Map<String, AgingBucketSummary> agingSummary) {

        return agingSummary.values()
                .stream()
                .map(AgingBucketSummary::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calculate percentage distribution by aging bucket.
     *
     * @param agingSummary Aging summary
     * @return Percentage map
     */
    public static Map<String, BigDecimal> calculateAgingPercentages(
            Map<String, AgingBucketSummary> agingSummary) {

        Map<String, BigDecimal> percentages = new HashMap<>();

        BigDecimal total = calculateTotalOutstanding(agingSummary);

        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return percentages;
        }

        for (Map.Entry<String, AgingBucketSummary> entry : agingSummary.entrySet()) {

            BigDecimal percentage = entry.getValue()
                    .getTotalAmount()
                    .divide(total, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            percentages.put(entry.getKey(), percentage);
        }

        return percentages;
    }

    /**
     * Get invoices by aging bucket.
     *
     * @param invoices List of invoices
     * @param minDays  Minimum days
     * @param maxDays  Maximum days
     * @param asOfDate Reference date
     * @return Filtered invoice list
     */
    public static List<ApInvoiceResponse> getInvoicesByAgingBucket(
            List<ApInvoiceResponse> invoices,
            int minDays,
            int maxDays,
            LocalDate asOfDate) {

        List<ApInvoiceResponse> bucketInvoices = new ArrayList<>();

        if (invoices == null || invoices.isEmpty()) {
            return bucketInvoices;
        }

        for (ApInvoiceResponse invoice : invoices) {

            int daysOverdue = calculateDaysOverdue(invoice.getDueDate(), asOfDate);

            if (daysOverdue >= minDays && daysOverdue <= maxDays) {
                bucketInvoices.add(invoice);
            }
        }

        return bucketInvoices;
    }

    // ============================================================
    // AGING BUCKET SUMMARY DTO
    // ============================================================

    @Getter
    public static class AgingBucketSummary {

        private final String bucketName;
        private final int minDays;
        private final int maxDays;

        private BigDecimal totalAmount = BigDecimal.ZERO;
        private long count = 0;

        public AgingBucketSummary(
                String bucketName,
                int minDays,
                int maxDays) {

            this.bucketName = bucketName;
            this.minDays = minDays;
            this.maxDays = maxDays;
        }

        public void addAmount(BigDecimal amount) {

            if (amount != null) {
                this.totalAmount = this.totalAmount.add(amount);
            }
        }

        public void incrementCount() {
            this.count++;
        }

        public double getPercentageOfTotal(BigDecimal grandTotal) {

            if (grandTotal == null ||
                    grandTotal.compareTo(BigDecimal.ZERO) == 0) {
                return 0;
            }

            return totalAmount
                    .divide(grandTotal, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
    }
}
