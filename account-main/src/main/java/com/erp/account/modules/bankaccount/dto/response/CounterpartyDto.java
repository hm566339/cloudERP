package com.erp.account.modules.bankaccount.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CounterpartyDto implements Serializable {
    private String name;
    private String accountNumber;
    private String bankName;
}
