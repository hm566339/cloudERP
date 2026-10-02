package com.erp.account.modules.vendor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
@Entity
@Table(name = "vendor", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "vendor_code"}, name = "uk_vendor_code_company"),
    @UniqueConstraint(columnNames = {"company_id", "gstin"}, name = "uk_vendor_gstin"),
    @UniqueConstraint(columnNames = {"pan_no", "company_id"}, name = "uk_vendor_pan_company")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "vendor_code", nullable = false)
    private String vendorCode;

    @Column(name = "vendor_name", nullable = false)
    private String vendorName;

    @Column(name = "gstin")
    private String gstin;

    @Column(name = "pan_no")
    private String panNo;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "pin_code")
    private String pinCode;

    @Column(name = "credit_limit", precision = 19, scale = 4)
    private BigDecimal creditLimit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payable_account_id", nullable = false)
    private ChartOfAccount payableAccount;

    @Column(name = "opening_balance", precision = 19, scale = 4)
    private BigDecimal openingBalance;

    @Column(name = "opening_balance_date")
    private LocalDate openingBalanceDate;

    @Column(name = "payment_term_days")
    private Integer paymentTermDays;

    @Column(name = "default_currency", length = 3)
    private String defaultCurrency;

    @Column(name = "tds_applicable", nullable = false)
    private Boolean tdsApplicable = false;

    @Column(name = "tds_section", length = 30)
    private String tdsSection;

    @Column(name = "tds_rate", precision = 9, scale = 4)
    private BigDecimal tdsRate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "vendor", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ApInvoice> apInvoices;

    @OneToMany(mappedBy = "vendor", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ApPayment> apPayments;

    @OneToMany(mappedBy = "vendor", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PaymentVoucher> paymentVouchers;

    @OneToMany(mappedBy = "vendor", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<VendorAddress> addresses;
}


