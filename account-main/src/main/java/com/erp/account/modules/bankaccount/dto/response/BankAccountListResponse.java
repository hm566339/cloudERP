package com.erp.account.modules.bankaccount.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountListResponse extends BaseResponseDto  implements Serializable {

    private List<BankAccountResponse> bankAccounts;
    private PaginationResponse pagination;
}
