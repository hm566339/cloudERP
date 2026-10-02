package com.erp.account.modules.expensecategory.dto.response;

import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseCategoryResponseList implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<ExpenseCategoryResponse> content;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;
    private boolean first;
    private boolean last;
    private boolean empty;
}
