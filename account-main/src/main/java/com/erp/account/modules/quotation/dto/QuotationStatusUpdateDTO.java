package com.erp.account.modules.quotation.dto;

import com.erp.account.modules.quotation.entity.QuotationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuotationStatusUpdateDTO {

    @NotNull(message = "Status is mandatory")
    private QuotationStatus status;

}
