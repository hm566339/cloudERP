package com.erp.account.modules.salesorder.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Customer Details for Sales Order")
public class SalesOrderCustomerDto extends BaseResponseDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Customer ID")
    private UUID id;

    @Schema(description = "Customer name")
    private String name;

    @Schema(description = "Customer code")
    private String code;

    @Schema(description = "Customer email")
    private String email;

    @Schema(description = "Customer phone number")
    private String phone;

    @Schema(description = "Structured billing address")
    private SalesOrderAddressDto billingAddress;

    @Schema(description = "Structured delivery address")
    private SalesOrderAddressDto deliveryAddress;

    // Convenience aliases for compatibility
    public String getCustomerName() {
        return name;
    }

    public String getCustomerCode() {
        return code;
    }
}
