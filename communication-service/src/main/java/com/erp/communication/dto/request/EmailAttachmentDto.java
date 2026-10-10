package com.erp.communication.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailAttachmentDto {

    @NotBlank(message = "Attachment filename is required")
    private String filename;

    private String contentType;

    @NotBlank(message = "Attachment dataBase64 is required")
    private String dataBase64;
}
