package com.erp.account.modules.expense.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpenseAttachmentUploadResponse {

    private String fileUrl;

    private String fileName;

    private String storedFileName;

    private String contentType;

    private Long size;
}
