package com.erp.manufacturing.productprofile.service;

import com.erp.manufacturing.productprofile.entity.ManufacturingProductProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManufacturingProductProfileService {
    Optional<ManufacturingProductProfile> getById(UUID id);
    List<ManufacturingProductProfile> getAll();
    void delete(UUID id);
}
