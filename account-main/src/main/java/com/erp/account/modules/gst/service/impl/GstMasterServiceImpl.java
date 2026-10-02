package com.erp.account.modules.gst.service.impl;

import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.BusinessException;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.modules.gst.dto.request.GstRegistrationRequest;
import com.erp.account.modules.gst.dto.request.GstStateRequest;
import com.erp.account.modules.gst.dto.response.GstRegistrationResponse;
import com.erp.account.modules.gst.dto.response.GstStateCodeResponse;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.mapper.GstRegistrationMapper;
import com.erp.account.modules.gst.mapper.GstStateCodeMapper;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.gst.service.GstMasterService;
import com.erp.account.modules.report.gst.event.GstCacheEvictEvent;
import com.erp.account.util.TenantUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GstMasterServiceImpl implements GstMasterService {

    private final GstStateCodeRepository stateCodeRepository;
    private final GstRegistrationRepository registrationRepository;
    private final GstStateCodeMapper stateCodeMapper;
    private final GstRegistrationMapper registrationMapper;
    private final ApplicationEventPublisher eventPublisher;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public GstStateCodeResponse createStateCode(ApiRequest<GstStateRequest> apiRequest) {
        GstStateRequest request = apiRequest.getData();
        stateCodeRepository.findByStateCodeAndIsDeletedFalse(request.getStateCode()).ifPresent(s -> {
            throw new BusinessException("State code already exists");
        });
        GstStateCode stateCode = stateCodeMapper.toEntity(request);
        return stateCodeMapper.toResponse(stateCodeRepository.save(stateCode));
    }

    @Override
    public GstStateCodeResponse updateStateCode(UUID id, ApiRequest<GstStateRequest> apiRequest) {
        GstStateRequest request = apiRequest.getData();
        GstStateCode stateCode = stateCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("State Code not found"));

        if (!stateCode.getStateCode().equals(request.getStateCode())) {
            stateCodeRepository.findByStateCodeAndIsDeletedFalse(request.getStateCode()).ifPresent(s -> {
                throw new BusinessException("State code already exists");
            });
        }

        stateCodeMapper.updateEntityFromRequest(request, stateCode);
        return stateCodeMapper.toResponse(stateCodeRepository.save(stateCode));
    }

    @Override
    @Transactional(readOnly = true)
    public GstStateCodeResponse getStateCodeById(UUID id) {
        return stateCodeRepository.findById(id)
                .map(stateCodeMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("State Code not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public GstStateCodeResponse getStateCodeByCode(String stateCode) {
        return stateCodeRepository.findByStateCodeAndIsDeletedFalse(stateCode)
                .map(stateCodeMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("State Code not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GstStateCodeResponse> getAllStateCodes() {
        return stateCodeRepository.findAll().stream()
                .filter(s -> !s.getIsDeleted())
                .map(stateCodeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<GstStateCodeResponse> getAllStateCodesPaginated(String search, org.springframework.data.domain.Pageable pageable) {
        return stateCodeRepository.findAllWithSearch(search, pageable)
                .map(stateCodeMapper::toResponse);
    }

    @Override
    public void deleteStateCode(UUID id) {
        GstStateCode stateCode = stateCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("State Code not found"));
        stateCode.setIsDeleted(true);
        stateCodeRepository.save(stateCode);
    }

    @Override
    public GstRegistrationResponse createRegistration(ApiRequest<GstRegistrationRequest> apiRequest, UUID companyId) {
        GstRegistrationRequest request = apiRequest.getData();
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        if (request.getGstin() != null) {
            registrationRepository.findByGstinAndIsDeletedFalse(request.getGstin()).ifPresent(r -> {
                throw new BusinessException("GSTIN already registered");
            });
        }

        if (request.getBranchId() != null) {
            try {
                Query branchQuery = entityManager.createNativeQuery(
                        "SELECT COUNT(1) FROM branch b WHERE b.id = :branchId AND b.company_id = :companyId");
                branchQuery.setParameter("branchId", request.getBranchId());
                branchQuery.setParameter("companyId", resolvedCompanyId);
                Number count = (Number) branchQuery.getSingleResult();
                if (count.longValue() == 0L) {
                    throw new ForbiddenException("Branch does not belong to the requested company or does not exist",
                            "BRANCH_COMPANY_MISMATCH");
                }
            } catch (ForbiddenException fe) {
                throw fe;
            } catch (Exception ignored) {
                // Skip strict validation if branch metadata is unavailable
            }
        }

        GstStateCode stateCode = stateCodeRepository.findById(request.getStateCodeId())
                .orElseThrow(() -> new ResourceNotFoundException("State Code not found"));

        GstRegistration registration = registrationMapper.toEntity(request);
        registration.setCompanyId(resolvedCompanyId);
        registration.setStateCode(stateCode);

        GstRegistration saved = registrationRepository.save(registration);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        }
        return registrationMapper.toResponse(saved);
    }

    @Override
    public GstRegistrationResponse updateRegistration(UUID id, ApiRequest<GstRegistrationRequest> apiRequest,
            UUID companyId) {
        GstRegistrationRequest request = apiRequest.getData();
        GstRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        if (!registration.getCompanyId().equals(resolvedCompanyId)) {
            throw new ForbiddenException("GST registration does not belong to the requested company",
                    "COMPANY_MISMATCH");
        }

        if (request.getGstin() != null && !request.getGstin().equals(registration.getGstin())) {
            registrationRepository.findByGstinAndIsDeletedFalse(request.getGstin()).ifPresent(r -> {
                throw new BusinessException("GSTIN already registered");
            });
        }

        if (request.getBranchId() != null) {
            try {
                Query branchQuery = entityManager.createNativeQuery(
                        "SELECT COUNT(1) FROM branch b WHERE b.id = :branchId AND b.company_id = :companyId");
                branchQuery.setParameter("branchId", request.getBranchId());
                branchQuery.setParameter("companyId", resolvedCompanyId);
                Number count = (Number) branchQuery.getSingleResult();
                if (count.longValue() == 0L) {
                    throw new ForbiddenException("Branch does not belong to the requested company or does not exist",
                            "BRANCH_COMPANY_MISMATCH");
                }
            } catch (ForbiddenException fe) {
                throw fe;
            } catch (Exception ignored) {
                // Skip strict validation if branch metadata is unavailable
            }
        }

        GstStateCode stateCode = stateCodeRepository.findById(request.getStateCodeId())
                .orElseThrow(() -> new ResourceNotFoundException("State Code not found"));

        registrationMapper.updateEntityFromRequest(request, registration);
        registration.setStateCode(stateCode);

        GstRegistration saved = registrationRepository.save(registration);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        }
        return registrationMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public GstRegistrationResponse getRegistrationById(UUID id) {
        GstRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        if (!TenantUtils.isSystemAdmin() && !registration.getCompanyId().equals(TenantUtils.getCurrentCompanyId())) {
            throw new ForbiddenException("Registration not found for the current company", "COMPANY_MISMATCH");
        }
        
        GstRegistrationResponse response = registrationMapper.toResponse(registration);
        
        // Enrich lightweight nested objects with names for the edit form
        if (response.getCompany() != null && response.getCompany().getId() != null) {
            try {
                String companyName = (String) entityManager.createNativeQuery("SELECT company_name FROM company WHERE id = :id")
                        .setParameter("id", response.getCompany().getId())
                        .getSingleResult();
                response.getCompany().setName(companyName);
            } catch (Exception ignored) {}
        }
        
        if (response.getBranch() != null && response.getBranch().getId() != null) {
            try {
                String branchName = (String) entityManager.createNativeQuery("SELECT branch_name FROM branch WHERE id = :id")
                        .setParameter("id", response.getBranch().getId())
                        .getSingleResult();
                response.getBranch().setName(branchName);
            } catch (Exception ignored) {}
        }
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GstRegistrationResponse> getRegistrationsByCompanyId(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        if (resolvedCompanyId == null) {
            throw new ForbiddenException("Company ID is required for this operation", "COMPANY_ID_REQUIRED");
        }
        return registrationRepository.findByCompanyIdAndIsDeletedFalse(resolvedCompanyId).stream()
                .map(registrationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GstRegistrationResponse getDefaultRegistrationByCompanyId(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        if (resolvedCompanyId == null) {
            throw new ForbiddenException("Company ID is required for this operation", "COMPANY_ID_REQUIRED");
        }
        return registrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(resolvedCompanyId)
                .map(registrationMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Default registration not found for company"));
    }

    @Override
    public void deleteRegistration(UUID id) {
        GstRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        if (!TenantUtils.isSystemAdmin() && !registration.getCompanyId().equals(TenantUtils.getCurrentCompanyId())) {
            throw new ForbiddenException("Registration not found for the current company", "COMPANY_MISMATCH");
        }
        registration.setIsDeleted(true);
        GstRegistration saved = registrationRepository.save(registration);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        }
    }
}
