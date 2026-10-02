package com.erp.account.modules.hsnsacmaster.service;

import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponseList;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterRequest;
import com.erp.account.enums.HsnSacType;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterFilterDto;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public interface HsnSacMasterService {

    PostResponse createHsnSacMaster(RequestWrapper<HsnSacMasterRequest> request);

    PostResponse updateHsnSacMaster(UUID hsnSacId, RequestWrapper<HsnSacMasterRequest> request);

    PostResponse deleteHsnSacMaster(UUID hsnSacId);

    HsnSacMasterResponse getHsnSacMasterById(UUID hsnSacId);

    HsnSacMasterResponse getHsnSacMasterByCode(String code);

    HsnSacMasterResponseList getAllHsnSacMasters(HsnSacMasterFilterDto filter, Pageable pageable);

    List<HsnSacMasterResponse> generateHsnWiseReport();

    List<HsnSacMasterResponse> generateSacWiseReport();

    void validateTaxApplicability(UUID hsnSacId);
}
