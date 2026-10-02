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
@Schema(description = "Structured Address Details for Sales Order")
public class SalesOrderAddressDto extends BaseResponseDto implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Address ID")
    private UUID id;

    @Schema(description = "Address line 1")
    private String addressLine1;

    @Schema(description = "Address line 2")
    private String addressLine2;

    @Schema(description = "City")
    private String city;

    @Schema(description = "State name")
    private String state;

    @Schema(description = "State code (e.g. 10, 27)")
    private String stateCode;

    @Schema(description = "Country")
    private String country;

    @Schema(description = "Country code")
    private String countryCode;

    @Schema(description = "Postal/Zip Code")
    private String postalCode;
}
