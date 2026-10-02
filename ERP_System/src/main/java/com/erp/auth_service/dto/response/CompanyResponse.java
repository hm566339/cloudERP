package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;

@Data
@Builder
public class CompanyResponse {

    private UUID id;

    private String companyCode;

    private String companyName;

    private String legalName;

    private String companyType; // Pvt Ltd, LLP, Partnership, Proprietorship

    private String gstin;

    private String pan;

    private String email;

    private String phone;

    private String website;

    private String addressLine1;

    private String addressLine2;

    private String city;

    private String state;

    private String country;

    private String baseCurrency;

    private String postalCode;

    private String logoUrl;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}