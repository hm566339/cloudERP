package com.erp.account.modules.gst.dto.request;

import com.erp.account.modules.gst.enums.GstRegistrationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.common.util.EmptyStringAsNullUuidDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstRegistrationRequest {

    @JsonDeserialize(using = EmptyStringAsNullUuidDeserializer.class)
    private UUID branchId;

    @NotBlank(message = "GSTIN is required")
    @Size(min = 15, max = 15, message = "GSTIN must be exactly 15 characters")
    private String gstin;

    @Size(min = 10, max = 10, message = "PAN must be exactly 10 characters")
    private String pan;

    @NotNull(message = "Registration type is required")
    private GstRegistrationType registrationType;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate registeredDate;

    @NotBlank(message = "Legal name is required")
    private String legalName;

    private String tradeName;

    @NotNull(message = "State Code ID is required")
    @JsonDeserialize(using = EmptyStringAsNullUuidDeserializer.class)
    private UUID stateCodeId;

    @JsonAlias({"default", "isDefault"})
    private Boolean isDefault;
}
