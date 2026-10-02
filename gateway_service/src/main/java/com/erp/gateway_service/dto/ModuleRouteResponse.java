package com.erp.gateway_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Objects;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ModuleRouteResponse {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("moduleId")
    private UUID moduleId;

    @JsonProperty("moduleName")
    private String moduleName;

    @JsonProperty("apiPattern")
    private String apiPattern;

    @JsonProperty("serviceUrl")
    private String serviceUrl;

    @JsonProperty("routeOrder")
    private Integer routeOrder;

    @JsonProperty("active")
    private Boolean active;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getModuleId() {
        return moduleId;
    }

    public void setModuleId(UUID moduleId) {
        this.moduleId = moduleId;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public String getApiPattern() {
        return apiPattern;
    }

    public void setApiPattern(String apiPattern) {
        this.apiPattern = apiPattern;
    }

    public String getServiceUrl() {
        return serviceUrl;
    }

    public void setServiceUrl(String serviceUrl) {
        this.serviceUrl = serviceUrl;
    }

    public Integer getRouteOrder() {
        return routeOrder;
    }

    public void setRouteOrder(Integer routeOrder) {
        this.routeOrder = routeOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    @Override
    public String toString() {
        return "ModuleRouteResponse{" +
                "id=" + id +
                ", moduleId=" + moduleId +
                ", moduleName='" + moduleName + '\'' +
                ", apiPattern='" + apiPattern + '\'' +
                ", serviceUrl='" + serviceUrl + '\'' +
                ", routeOrder=" + routeOrder +
                ", active=" + active +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ModuleRouteResponse that = (ModuleRouteResponse) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}