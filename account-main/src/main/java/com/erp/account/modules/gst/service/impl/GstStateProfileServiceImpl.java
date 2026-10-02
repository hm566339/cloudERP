package com.erp.account.modules.gst.service.impl;

import com.erp.account.modules.gst.dto.profile.*;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.gst.service.GstStateProfileService;
import com.erp.account.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GstStateProfileServiceImpl implements GstStateProfileService {

    private final GstStateCodeRepository repository;

    @PersistenceContext
    private EntityManager entityManager;

    private GstStateCode getEntity(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("GST State not found for ID: " + id));
    }

    @Override
    public GstStateProfileDto getGstStateProfile(UUID id) {
        GstStateCode state = getEntity(id);
        
        GstStateProfileDto dto = new GstStateProfileDto();
        
        StateInfoDto stateInfo = new StateInfoDto();
        stateInfo.setId(state.getId());
        stateInfo.setStateCode(state.getStateCode());
        stateInfo.setStateName(state.getStateName());
        stateInfo.setShortName(state.getShortName());
        stateInfo.setIsoStateCode(state.getIsoStateCode());
        stateInfo.setUnionTerritory(state.isUnionTerritory());
        stateInfo.setCapitalCity(state.getCapitalCity());
        stateInfo.setRegion(state.getRegion());
        dto.setState(stateInfo);

        if (state.getCountry() != null) {
            CountryInfoDto countryInfo = new CountryInfoDto();
            countryInfo.setId(state.getCountry().getId());
            countryInfo.setCountryCode(state.getCountry().getCountryCode());
            countryInfo.setCountryName(state.getCountry().getCountryName());
            countryInfo.setIsoCountryCode(state.getCountry().getIsoCountryCode());
            dto.setCountry(countryInfo);
        }

        GstInformationDto gstInfo = new GstInformationDto();
        gstInfo.setGstStateCode(state.getStateCode());
        gstInfo.setGstStateName(state.getStateName());
        gstInfo.setRegistrationAllowed(state.getRegistrationAllowed() != null ? state.getRegistrationAllowed() : false);
        gstInfo.setDefaultPlaceOfSupply(state.getDefaultPlaceOfSupply());
        gstInfo.setReverseChargeApplicable(state.getReverseChargeApplicable() != null ? state.getReverseChargeApplicable() : false);
        dto.setGstInformation(gstInfo);

        AddressMetadataDto addressMeta = new AddressMetadataDto();
        addressMeta.setCapitalCity(state.getCapitalCity());
        addressMeta.setRegion(state.getRegion());
        addressMeta.setTimeZone(state.getTimeZone());
        addressMeta.setCurrencyCode(state.getCurrencyCode());
        addressMeta.setCurrencyName(state.getCurrencyName());
        dto.setAddressMetadata(addressMeta);

        AuditInfoDto auditInfo = new AuditInfoDto();
        auditInfo.setCreatedBy(state.getCreatedBy() != null ? state.getCreatedBy().toString() : null);
        auditInfo.setCreatedAt(state.getCreatedAt());
        auditInfo.setUpdatedBy(state.getUpdatedBy() != null ? state.getUpdatedBy().toString() : null);
        auditInfo.setUpdatedAt(state.getUpdatedAt());
        auditInfo.setActive(true);
        dto.setAudit(auditInfo);

        return dto;
    }

    @Override
    public GstStateStatisticsDto getGstStateStatistics(UUID id) {
        GstStateCode state = getEntity(id);
        
        // Optimized native/JPQL queries to count relations based on state_name to avoid N+1
        String stateName = state.getStateName();
        
        Long customerCount = countQuery("SELECT COUNT(c.id) FROM Customer c WHERE c.state = :stateName", stateName);
        Long vendorCount = countQuery("SELECT COUNT(v.id) FROM Vendor v WHERE v.state = :stateName", stateName);
        Long branchCount = countQuery("SELECT COUNT(b.id) FROM Branch b WHERE b.state = :stateName", stateName);
        Long gstRegCount = countQuery("SELECT COUNT(g.id) FROM GstRegistration g WHERE g.stateName = :stateName", stateName);

        GstStateStatisticsDto stats = new GstStateStatisticsDto();
        stats.setCustomerCount(customerCount);
        stats.setVendorCount(vendorCount);
        stats.setBranchCount(branchCount);
        stats.setGstRegistrationCount(gstRegCount);
        
        return stats;
    }

    private Long countQuery(String jpql, String stateName) {
        try {
            Query q = entityManager.createQuery(jpql);
            q.setParameter("stateName", stateName);
            return (Long) q.getSingleResult();
        } catch (Exception e) {
            log.warn("Error running count query for state {}: {}", stateName, e.getMessage());
            return 0L; // Fallback if entity doesn't exist or table is empty
        }
    }

    @Override
    public GstStateOverviewDto getGstStateOverview(UUID id) {
        GstStateProfileDto profile = getGstStateProfile(id);
        GstStateStatisticsDto stats = getGstStateStatistics(id);

        GstStateOverviewDto overview = new GstStateOverviewDto();
        overview.setState(profile.getState());
        overview.setCountry(profile.getCountry());
        overview.setGstInformation(profile.getGstInformation());
        overview.setAddressMetadata(profile.getAddressMetadata());
        overview.setAudit(profile.getAudit());
        overview.setStatistics(stats);

        return overview;
    }

    @Override
    public GstStateRelationsDto getGstStateRelations(UUID id) {
        GstStateCode state = getEntity(id);
        String stateName = state.getStateName();
        
        GstStateRelationsDto relations = new GstStateRelationsDto();
        
        // Example optimized projection query avoiding full entity load
        try {
            Query q = entityManager.createQuery("SELECT c.id, c.customerCode, c.name, c.isActive FROM Customer c WHERE c.state = :stateName");
            q.setParameter("stateName", stateName);
            q.setMaxResults(100); // Limit to 100 for relation summary
            List<Object[]> results = q.getResultList();
            for (Object[] row : results) {
                CustomerSummaryDto dto = new CustomerSummaryDto();
                dto.setId((UUID) row[0]);
                dto.setCode((String) row[1]);
                dto.setName((String) row[2]);
                dto.setStatus((Boolean) row[3]);
                relations.getCustomers().add(dto);
            }
        } catch(Exception e) {
            log.warn("Customer summary projection failed");
        }
        
        return relations;
    }
}
