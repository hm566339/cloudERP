package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateCompanyModulesRequest {

    private List<ModuleAssignmentDto> modules;
    private List<String> moduleKeys;

    private UpdateCompanyModulesRequest data;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ModuleAssignmentDto {
        private String moduleKey;
        private String key;
        private String name;
        private Boolean enabled;

        public String resolveKey() {
            if (moduleKey != null && !moduleKey.isBlank()) return moduleKey.trim();
            if (key != null && !key.isBlank()) return key.trim();
            if (name != null && !name.isBlank()) return name.trim();
            return null;
        }
    }

    public List<ModuleAssignmentDto> resolveModules() {
        if (data != null && data.getModules() != null) {
            return data.getModules();
        }
        return modules;
    }

    public List<String> resolveModuleKeys() {
        if (data != null && data.getModuleKeys() != null) {
            return data.getModuleKeys();
        }
        return moduleKeys;
    }
}

