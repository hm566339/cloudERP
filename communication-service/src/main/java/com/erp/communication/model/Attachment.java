package com.erp.communication.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    private String filename;
    private String contentType;
    private byte[] data;
}
