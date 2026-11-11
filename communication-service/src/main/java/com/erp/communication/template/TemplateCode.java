package com.erp.communication.template;

public enum TemplateCode {
    EMPLOYEE_PROVISIONING("email-employee-provisioning", "Your Mark2 ERP Account Is Ready — Set Your Password"),
    USER_INVITATION("email-user-invitation", "Welcome to {organizationName} - Activate Your Account"),
    USER_VERIFICATION("email-user-verification", "Verify Your Email Address — Mark2 ERP"),
    PASSWORD_RESET("email-password-reset", "Reset Your Password — Mark2 ERP"),
    ORGANIZATION_CREATED("email-organization-created", "Your Mark2 ERP Account Is Ready!"),
    QUOTATION_EMAIL("email-quotation", "Quotation from Mark2 ERP"),
    RFQ_VENDOR_INVITATION("email-rfq-invitation", "Request for Quotation"),
    SALES_INVOICE("email-sales-invoice", "Tax Invoice"),
    PURCHASE_INVOICE("email-purchase-invoice", "Purchase Invoice Notice"),
    CUSTOM("custom", "Mark2 ERP Notification");

    private final String templateName;
    private final String defaultSubject;

    TemplateCode(String templateName, String defaultSubject) {
        this.templateName = templateName;
        this.defaultSubject = defaultSubject;
    }

    public String getTemplateName() {
        return templateName;
    }

    public String getDefaultSubject() {
        return defaultSubject;
    }
}
