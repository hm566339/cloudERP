package com.erp.account.modules.salesorder.service.v2;

import com.erp.account.modules.salesorder.dto.response.v2.SalesOrderV2Response;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface SalesOrderQueryService {

    SalesOrderV2Response getSalesOrderById(UUID companyId, UUID salesOrderId);

}
