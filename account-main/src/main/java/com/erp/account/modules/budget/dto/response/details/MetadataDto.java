package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetadataDto implements Serializable {
    private Boolean printable;
    private Boolean exportable;
    private Boolean editable;
    private Boolean deletable;
}
