package com.erp.communication.channel.email;

import com.erp.communication.model.Attachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {

    private UUID notificationId;
    private UUID companyId;
    private String recipient;
    private String subject;
    private String htmlBody;
    private String textBody;

    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();
}
