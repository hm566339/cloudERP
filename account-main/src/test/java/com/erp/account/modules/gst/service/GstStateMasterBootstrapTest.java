package com.erp.account.modules.gst.service;

import com.erp.account.modules.common.entity.Country;
import com.erp.account.modules.common.repository.CountryRepository;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class GstStateMasterBootstrapTest {

    @Mock
    private GstStateCodeRepository gstStateCodeRepository;

    @Mock
    private CountryRepository countryRepository;

    @InjectMocks
    private GstStateMasterBootstrap bootstrap;

    private Country india;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        india = new Country();
        india.setCountryCode("IN");
        when(countryRepository.findByCountryCodeIgnoreCase("IN")).thenReturn(Optional.of(india));
    }

    @Test
    public void testEmptyDatabase_ShouldInsertAll() throws Exception {
        when(gstStateCodeRepository.findAll()).thenReturn(new ArrayList<>());
        
        bootstrap.run(null);
        
        verify(gstStateCodeRepository, times(37)).save(any(GstStateCode.class));
    }

    @Test
    public void testCompleteDatabase_ShouldNotInsert() throws Exception {
        // We will just simulate 1 state to keep it simple, since Excel has 37, it will insert 36 and skip 1
        List<GstStateCode> existing = new ArrayList<>();
        GstStateCode bihar = GstStateCode.builder()
                .stateCode("10")
                .stateName("BIHAR")
                .shortName("BH")
                .country(india)
                .displayName("10 - BIHAR")
                .build();
        existing.add(bihar);
        
        when(gstStateCodeRepository.findAll()).thenReturn(existing);
        
        bootstrap.run(null);
        
        // 36 new inserts, 0 updates (bihar matches exactly)
        verify(gstStateCodeRepository, times(36)).save(any(GstStateCode.class));
    }

    @Test
    public void testIncorrectExistingData_ShouldUpdateSafeFields() throws Exception {
        List<GstStateCode> existing = new ArrayList<>();
        GstStateCode biharWrong = GstStateCode.builder()
                .stateCode("87") // Wrong code
                .stateName("BIHAR")
                .shortName("BH")
                .country(india)
                .displayName("10 - BIHAR")
                .build();
        existing.add(biharWrong);
        
        when(gstStateCodeRepository.findAll()).thenReturn(existing);
        
        bootstrap.run(null);
        
        ArgumentCaptor<GstStateCode> captor = ArgumentCaptor.forClass(GstStateCode.class);
        verify(gstStateCodeRepository, atLeastOnce()).save(captor.capture());
        
        // Check if bihar was updated
        boolean biharUpdated = captor.getAllValues().stream()
                .anyMatch(s -> s.getStateName().equals("BIHAR") && s.getStateCode().equals("10"));
        
        assertTrue(biharUpdated, "Bihar should have its state code updated to 10");
    }
}
