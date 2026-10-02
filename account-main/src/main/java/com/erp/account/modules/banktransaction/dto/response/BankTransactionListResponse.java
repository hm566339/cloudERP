package com.erp.account.modules.banktransaction.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionListResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<BankTransactionResponse> transactions;
    private Integer pageNumber;
    private Integer pageSize;
    private Long totalElements;
    private Integer totalPages;
    private Boolean isLast;
}
