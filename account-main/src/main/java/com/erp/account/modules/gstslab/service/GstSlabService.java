package com.erp.account.modules.gstslab.service;

import java.util.UUID;

import com.erp.account.modules.gstslab.dto.response.GstSlabResponse;
import com.erp.account.modules.gstslab.dto.response.GstSlabResponseList;
import com.erp.account.modules.gstslab.dto.response.GstSlabProfileResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.gstslab.dto.request.GstSlabFilterDto;
import com.erp.account.modules.gstslab.dto.request.GstSlabRequest;
import org.springframework.data.domain.Pageable;

public interface GstSlabService {

    PostResponse createGstSlab(RequestWrapper<GstSlabRequest> request);

    PostResponse updateGstSlab(RequestWrapper<GstSlabRequest> request, UUID gstSlabId);

    GstSlabProfileResponse getGstSlabById(UUID gstSlabId);

    GstSlabResponseList getAllGstSlabs(GstSlabFilterDto filter, Pageable pageable);

    PostResponse deleteGstSlab(UUID gstSlabId);
}
