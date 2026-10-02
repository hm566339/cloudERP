package com.erp.account.modules.rfq.service;

import com.erp.account.modules.rfq.dto.*;
import org.springframework.data.domain.*;
import java.util.UUID;

public interface RfqService {
    RfqResponse create(UUID companyId, RfqRequest request);

    RfqResponse get(UUID companyId, UUID id);

    Page<RfqResponse> list(UUID companyId, Pageable pageable);

    RfqResponse update(UUID companyId, UUID id, RfqRequest request);

    RfqSendResponse send(UUID companyId, UUID id);

    RfqResponse close(UUID companyId, UUID id);

    RfqResponse cancel(UUID companyId, UUID id);
}
