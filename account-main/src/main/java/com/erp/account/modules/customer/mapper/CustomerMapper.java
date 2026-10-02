package com.erp.account.modules.customer.mapper;

import com.erp.account.modules.customer.dto.request.CustomerRequest;
import com.erp.account.modules.customer.dto.response.CustomerAddressResponse;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface CustomerMapper {

    @Mapping(source = "company.id", target = "companyId")
    @Mapping(source = "company.companyName", target = "companyName")
    CustomerResponse entityToResponse(Customer customer);

    @Mapping(source = "gstState.id", target = "gstStateId")
    @Mapping(source = "gstState.stateCode", target = "gstStateCode")
    @Mapping(source = "gstState.stateName", target = "gstStateName")
    CustomerAddressResponse addressEntityToResponse(CustomerAddress address);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoices", ignore = true)
    @Mapping(target = "receiptVouchers", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    Customer requestToEntity(CustomerRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "salesInvoices", ignore = true)
    @Mapping(target = "receiptVouchers", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    void updateEntityFromRequest(CustomerRequest request, @MappingTarget Customer customer);

    List<CustomerResponse> entityListToResponseList(List<Customer> customers);
}
