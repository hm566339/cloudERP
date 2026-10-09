package com.erp.workflow.dto.response;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowFormSchema {

    private String documentType;
    private Integer version;
    private String title;
    private String description;
    private List<FormGroup> groups;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FormGroup {
        private String id;
        private String title;
        private String description;
        private List<FormField> fields;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FormField {
        private String name;
        private String label;
        private String type; // text, number, textarea, select, multiselect, checkbox, radio, date, datetime, file
        private Boolean required;
        private Boolean readOnly;
        private String defaultValue;
        private Object value;
        private String placeholder;
        private String helperText;
        private List<FieldOption> options;
        private String conditionalVisibility;
        private Map<String, Object> validation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FieldOption {
        private String label;
        private String value;
    }
}
