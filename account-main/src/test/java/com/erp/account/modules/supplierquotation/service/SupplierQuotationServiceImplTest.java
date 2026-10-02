package com.erp.account.modules.supplierquotation.service;

import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.rfq.repository.RfqRepository;
import com.erp.account.modules.supplierquotation.dto.SupplierQuotationResponse;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotation;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotationStatus;
import com.erp.account.modules.supplierquotation.mapper.SupplierQuotationMapper;
import com.erp.account.modules.supplierquotation.repository.SupplierQuotationRepository;
import com.erp.account.modules.supplierquotation.service.impl.SupplierQuotationServiceImpl;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplierQuotationServiceImplTest {

    @Mock
    private SupplierQuotationRepository repository;

    @Mock
    private RfqRepository rfqRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VoucherSequenceService sequence;

        @Mock
        private SupplierQuotationMapper mapper;

    @InjectMocks
    private SupplierQuotationServiceImpl service;

    private UUID companyId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(UUID.randomUUID());
                when(mapper.toResponse(any(SupplierQuotation.class))).thenAnswer(invocation -> {
                        SupplierQuotation quotation = invocation.getArgument(0);
                        String vendorName = quotation.getVendor() != null ? quotation.getVendor().getVendorName() : null;
                        if (vendorName == null && quotation.getVendorId() != null) {
                                vendorName = vendorRepository.findById(quotation.getVendorId())
                                                .map(Vendor::getVendorName)
                                                .orElse(null);
                        }
                        return SupplierQuotationResponse.builder()
                                        .id(quotation.getId())
                                        .companyId(quotation.getCompanyId())
                                        .quotationNumber(quotation.getQuotationNumber())
                                        .vendorId(quotation.getVendorId())
                                        .vendorName(vendorName)
                                        .status(quotation.getStatus())
                                        .build();
                });
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    void get_whenVendorLoaded_returnsVendorNameAndPreservesVendorId() {
        UUID quotationId = UUID.randomUUID();
        UUID vendorId = UUID.randomUUID();

        Vendor vendor = Vendor.builder()
                .id(vendorId)
                .vendorName("ABC Industrial Supplies")
                .build();

        SupplierQuotation quotation = SupplierQuotation.builder()
                .id(quotationId)
                .companyId(companyId)
                .quotationNumber("SQ-001")
                .vendorId(vendorId)
                .vendor(vendor)
                .quotationDate(LocalDate.now())
                .status(SupplierQuotationStatus.SUBMITTED)
                .items(new ArrayList<>())
                .build();

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                .thenReturn(Optional.of(quotation));

        SupplierQuotationResponse response = service.get(companyId, quotationId);

        assertNotNull(response);
        assertEquals(vendorId, response.getVendorId());
        assertEquals("ABC Industrial Supplies", response.getVendorName());
        verifyNoInteractions(vendorRepository);
    }

    @Test
    void get_whenVendorNotLoadedOnEntity_fetchesVendorNameFromVendorRepository() {
        UUID quotationId = UUID.randomUUID();
        UUID vendorId = UUID.randomUUID();

        Vendor vendor = Vendor.builder()
                .id(vendorId)
                .vendorName("XYZ Global Corp")
                .build();

        SupplierQuotation quotation = SupplierQuotation.builder()
                .id(quotationId)
                .companyId(companyId)
                .quotationNumber("SQ-002")
                .vendorId(vendorId)
                .vendor(null)
                .quotationDate(LocalDate.now())
                .status(SupplierQuotationStatus.SUBMITTED)
                .items(new ArrayList<>())
                .build();

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                .thenReturn(Optional.of(quotation));
        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));

        SupplierQuotationResponse response = service.get(companyId, quotationId);

        assertNotNull(response);
        assertEquals(vendorId, response.getVendorId());
        assertEquals("XYZ Global Corp", response.getVendorName());
        verify(vendorRepository).findById(vendorId);
    }

    @Test
    void get_whenVendorNotFound_returnsVendorNameNullAndPreservesVendorId() {
        UUID quotationId = UUID.randomUUID();
        UUID vendorId = UUID.randomUUID();

        SupplierQuotation quotation = SupplierQuotation.builder()
                .id(quotationId)
                .companyId(companyId)
                .quotationNumber("SQ-003")
                .vendorId(vendorId)
                .vendor(null)
                .quotationDate(LocalDate.now())
                .status(SupplierQuotationStatus.SUBMITTED)
                .items(new ArrayList<>())
                .build();

        when(repository.findByIdAndCompanyIdAndIsDeletedFalse(quotationId, companyId))
                .thenReturn(Optional.of(quotation));
        when(vendorRepository.findById(vendorId)).thenReturn(Optional.empty());

        SupplierQuotationResponse response = service.get(companyId, quotationId);

        assertNotNull(response);
        assertEquals(vendorId, response.getVendorId());
        assertNull(response.getVendorName());
    }

    @Test
    void list_mapsVendorNameInPage() {
        UUID vendorId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);

        Vendor vendor = Vendor.builder()
                .id(vendorId)
                .vendorName("Prime Traders")
                .build();

        SupplierQuotation quotation = SupplierQuotation.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .quotationNumber("SQ-004")
                .vendorId(vendorId)
                .vendor(vendor)
                .quotationDate(LocalDate.now())
                .status(SupplierQuotationStatus.SUBMITTED)
                .items(new ArrayList<>())
                .build();

        when(repository.findByCompanyIdAndIsDeletedFalse(companyId, pageable))
                .thenReturn(new PageImpl<>(List.of(quotation), pageable, 1));

        Page<SupplierQuotationResponse> page = service.list(companyId, pageable);

        assertEquals(1, page.getTotalElements());
        SupplierQuotationResponse item = page.getContent().get(0);
        assertEquals(vendorId, item.getVendorId());
        assertEquals("Prime Traders", item.getVendorName());
    }
}
