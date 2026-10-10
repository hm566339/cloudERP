package com.erp.communication.template;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenderedEmail {

    private String subject;
    private String htmlContent;
    private String plainTextContent;
}
