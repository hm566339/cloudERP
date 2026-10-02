package com.erp.account.modules.deliverychallan.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "delivery_challan", indexes = {
        @Index(name = "idx_dc_company", columnList = "company_id"),
        @Index(name = "idx_dc_customer", columnList = "customer_id"),
        @Index(name = "idx_dc_so", columnList = "source_so_id"),
        @Index(name = "idx_dc_si", columnList = "source_si_id"),
        @Index(name = "idx_dc_rv", columnList = "source_rv_id"),
        @Index(name = "idx_dc_number", columnList = "dc_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryChallan extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "dc_number", nullable = false, length = 50)
    private String dcNumber;

    @Column(name = "dc_date", nullable = false)
    private LocalDate dcDate;

    // Lineage from Sales Order
    @Column(name = "source_so_id", updatable = false)
    private UUID sourceSalesOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_so_id", insertable = false, updatable = false)
    private SalesOrder sourceSalesOrder;

    @Column(name = "source_so_number", length = 50, updatable = false)
    private String sourceSalesOrderNumber;

    // Lineage from Sales Invoice
    @Column(name = "source_si_id", updatable = false)
    private UUID sourceSalesInvoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_si_id", insertable = false, updatable = false)
    private SalesInvoice sourceSalesInvoice;

    @Column(name = "source_si_number", length = 50, updatable = false)
    private String sourceSalesInvoiceNumber;

    // Lineage from Receipt Voucher
    @Column(name = "source_rv_id", updatable = false)
    private UUID sourceReceiptVoucherId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_rv_id", insertable = false, updatable = false)
    private ReceiptVoucher sourceReceiptVoucher;

    @Column(name = "source_rv_number", length = 50, updatable = false)
    private String sourceReceiptVoucherNumber;

    // Customer
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    // Address Snapshots
    @Column(name = "billing_address_id")
    private UUID billingAddressId;

    @Column(name = "billing_address_snapshot", columnDefinition = "TEXT")
    private String billingAddressSnapshot;

    @Column(name = "billing_state_code", length = 2)
    private String billingStateCode;

    @Column(name = "delivery_address_id")
    private UUID deliveryAddressId;

    @Column(name = "delivery_address_snapshot", columnDefinition = "TEXT")
    private String deliveryAddressSnapshot;

    // Dispatch Details
    @Column(name = "dispatch_date")
    private LocalDate dispatchDate;

    @Column(name = "transporter_id")
    private UUID transporterId;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "lr_number", length = 100)
    private String lrNumber;

    // Commercial Details
    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    // Totals
    @Column(name = "subtotal", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DeliveryChallanStatus status = DeliveryChallanStatus.DRAFT;

    @OneToMany(mappedBy = "deliveryChallan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DeliveryChallanItem> items = new ArrayList<>();



    public void addDeliveryChallanItem(DeliveryChallanItem item) {
        items.add(item);
        item.setDeliveryChallan(this);
    }

    public void removeDeliveryChallanItem(DeliveryChallanItem item) {
        items.remove(item);
        item.setDeliveryChallan(null);
    }
}
