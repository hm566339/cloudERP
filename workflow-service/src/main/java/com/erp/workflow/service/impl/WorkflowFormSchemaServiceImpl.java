package com.erp.workflow.service.impl;

import com.erp.workflow.dto.response.WorkflowFormSchema;
import com.erp.workflow.dto.response.WorkflowFormSchema.FieldOption;
import com.erp.workflow.dto.response.WorkflowFormSchema.FormField;
import com.erp.workflow.dto.response.WorkflowFormSchema.FormGroup;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.service.WorkflowFormSchemaService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WorkflowFormSchemaServiceImpl implements WorkflowFormSchemaService {

    @Override
    public WorkflowFormSchema getSchemaForDocumentType(String documentType) {
        String normalized = documentType != null ? documentType.toUpperCase().trim() : "GENERAL";

        switch (normalized) {
            case "EXPENSE":
            case "EXPENSES":
                return buildExpenseSchema();
            case "PURCHASE":
            case "PURCHASE_ORDER":
                return buildPurchaseSchema();
            case "SALES":
            case "QUOTATION":
                return buildSalesSchema();
            case "INVOICE":
            case "INVOICES":
                return buildInvoiceSchema();
            case "REIMBURSEMENT":
            case "REIMBURSEMENTS":
                return buildReimbursementSchema();
            default:
                return buildGeneralSchema(normalized);
        }
    }

    @Override
    public WorkflowFormSchema populateSchemaWithTransaction(WorkflowFormSchema schema, WorkflowTransaction txn, boolean isReadOnly) {
        if (schema == null || txn == null) {
            return schema;
        }

        List<FormGroup> updatedGroups = new ArrayList<>();
        for (FormGroup group : schema.getGroups()) {
            List<FormField> updatedFields = new ArrayList<>();
            for (FormField field : group.getFields()) {
                FormField copy = FormField.builder()
                        .name(field.getName())
                        .label(field.getLabel())
                        .type(field.getType())
                        .required(field.getRequired())
                        .readOnly(isReadOnly ? Boolean.TRUE : field.getReadOnly())
                        .defaultValue(field.getDefaultValue())
                        .placeholder(field.getPlaceholder())
                        .helperText(field.getHelperText())
                        .options(field.getOptions())
                        .conditionalVisibility(field.getConditionalVisibility())
                        .validation(field.getValidation())
                        .value(resolveFieldValue(field.getName(), txn))
                        .build();
                updatedFields.add(copy);
            }
            updatedGroups.add(FormGroup.builder()
                    .id(group.getId())
                    .title(group.getTitle())
                    .description(group.getDescription())
                    .fields(updatedFields)
                    .build());
        }

        return WorkflowFormSchema.builder()
                .documentType(schema.getDocumentType())
                .version(schema.getVersion())
                .title(schema.getTitle())
                .description(schema.getDescription())
                .groups(updatedGroups)
                .build();
    }

    private Object resolveFieldValue(String fieldName, WorkflowTransaction txn) {
        if ("documentNumber".equalsIgnoreCase(fieldName)) {
            return txn.getDocumentNumber();
        }
        if ("documentType".equalsIgnoreCase(fieldName)) {
            return txn.getDocumentType();
        }
        if ("status".equalsIgnoreCase(fieldName)) {
            return txn.getStatus();
        }
        if ("initiatedByName".equalsIgnoreCase(fieldName) || "initiatedBy".equalsIgnoreCase(fieldName) || "employeeName".equalsIgnoreCase(fieldName) || "salesRep".equalsIgnoreCase(fieldName)) {
            return txn.getInitiatedByName();
        }
        if ("currentStage".equalsIgnoreCase(fieldName)) {
            return txn.getCurrentStage() != null ? txn.getCurrentStage().getStageName() : "";
        }
        return null;
    }

    private WorkflowFormSchema buildExpenseSchema() {
        return WorkflowFormSchema.builder()
                .documentType("EXPENSE")
                .version(1)
                .title("Expense Claim Form")
                .description("Dynamic submission and verification form for expense approvals")
                .groups(List.of(
                        FormGroup.builder()
                                .id("overview")
                                .title("General Information")
                                .description("Basic document and expense categorization details")
                                .fields(List.of(
                                        FormField.builder().name("documentNumber").label("Expense Reference").type("text").readOnly(true).placeholder("Auto-generated reference").build(),
                                        FormField.builder().name("title").label("Expense Title").type("text").required(true).placeholder("e.g. Client Dinner Q3").build(),
                                        FormField.builder().name("category").label("Category").type("select").required(true)
                                                .options(List.of(
                                                        new FieldOption("Travel & Lodging", "TRAVEL"),
                                                        new FieldOption("Meals & Entertainment", "MEALS"),
                                                        new FieldOption("Office Supplies", "SUPPLIES"),
                                                        new FieldOption("Software & Subscriptions", "SOFTWARE"),
                                                        new FieldOption("Professional Services", "SERVICES"),
                                                        new FieldOption("Other", "OTHER")
                                                )).build(),
                                        FormField.builder().name("expenseDate").label("Date Incurred").type("date").required(true).build(),
                                        FormField.builder().name("department").label("Department").type("select").required(true)
                                                .options(List.of(
                                                        new FieldOption("Sales", "SALES"),
                                                        new FieldOption("Finance & Accounts", "FINANCE"),
                                                        new FieldOption("Engineering", "ENGINEERING"),
                                                        new FieldOption("Operations", "OPERATIONS"),
                                                        new FieldOption("Human Resources", "HR")
                                                )).build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("financials")
                                .title("Financial Details")
                                .description("Amount and payment arrangement")
                                .fields(List.of(
                                        FormField.builder().name("amount").label("Total Amount").type("number").required(true).placeholder("0.00").build(),
                                        FormField.builder().name("currency").label("Currency").type("select").defaultValue("INR")
                                                .options(List.of(
                                                        new FieldOption("INR (₹)", "INR"),
                                                        new FieldOption("USD ($)", "USD"),
                                                        new FieldOption("EUR (€)", "EUR"),
                                                        new FieldOption("GBP (£)", "GBP")
                                                )).build(),
                                        FormField.builder().name("paymentMethod").label("Payment Method").type("select")
                                                .options(List.of(
                                                        new FieldOption("Corporate Credit Card", "CORP_CARD"),
                                                        new FieldOption("Personal Out-of-Pocket", "PERSONAL"),
                                                        new FieldOption("Direct Vendor Invoice", "INVOICE")
                                                )).build(),
                                        FormField.builder().name("billable").label("Billable to Client").type("checkbox").build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("justification")
                                .title("Justification & Remarks")
                                .description("Detailed reasoning for approver review")
                                .fields(List.of(
                                        FormField.builder().name("vendorName").label("Vendor / Payee Name").type("text").placeholder("e.g. Airline, Restaurant, Vendor").build(),
                                        FormField.builder().name("purpose").label("Business Purpose").type("textarea").required(true).placeholder("Explain business justification and project context").build(),
                                        FormField.builder().name("notes").label("Additional Notes").type("textarea").placeholder("Optional notes or instructions for reviewers").build()
                                ))
                                .build()
                ))
                .build();
    }

    private WorkflowFormSchema buildPurchaseSchema() {
        return WorkflowFormSchema.builder()
                .documentType("PURCHASE")
                .version(1)
                .title("Purchase Order Approval Form")
                .description("Procurement order details and vendor commitments")
                .groups(List.of(
                        FormGroup.builder()
                                .id("po_overview")
                                .title("PO Identification")
                                .fields(List.of(
                                        FormField.builder().name("documentNumber").label("PO Number").type("text").readOnly(true).build(),
                                        FormField.builder().name("vendorName").label("Vendor Name").type("text").required(true).build(),
                                        FormField.builder().name("deliveryDate").label("Expected Delivery Date").type("date").required(true).build(),
                                        FormField.builder().name("department").label("Requesting Department").type("select")
                                                .options(List.of(
                                                        new FieldOption("Procurement", "PROCUREMENT"),
                                                        new FieldOption("IT & Infrastructure", "IT"),
                                                        new FieldOption("Manufacturing", "MANUFACTURING"),
                                                        new FieldOption("General Admin", "ADMIN")
                                                )).build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("po_commercials")
                                .title("Commercial & Financial Terms")
                                .fields(List.of(
                                        FormField.builder().name("totalAmount").label("Total Order Value").type("number").required(true).build(),
                                        FormField.builder().name("taxAmount").label("Estimated Tax / GST").type("number").build(),
                                        FormField.builder().name("currency").label("Currency").type("select").defaultValue("INR")
                                                .options(List.of(new FieldOption("INR", "INR"), new FieldOption("USD", "USD"))).build(),
                                        FormField.builder().name("paymentTerms").label("Payment Terms").type("select")
                                                .options(List.of(
                                                        new FieldOption("Net 30 Days", "NET_30"),
                                                        new FieldOption("Net 60 Days", "NET_60"),
                                                        new FieldOption("Immediate on Delivery", "COD"),
                                                        new FieldOption("100% Advance", "ADVANCE")
                                                )).build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("po_justification")
                                .title("Procurement Justification")
                                .fields(List.of(
                                        FormField.builder().name("purpose").label("Procurement Need & Rationale").type("textarea").required(true).build(),
                                        FormField.builder().name("priority").label("Urgency / Priority").type("radio").defaultValue("NORMAL")
                                                .options(List.of(
                                                        new FieldOption("Normal", "NORMAL"),
                                                        new FieldOption("High Priority", "HIGH"),
                                                        new FieldOption("Critical / Emergency", "CRITICAL")
                                                )).build()
                                ))
                                .build()
                ))
                .build();
    }

    private WorkflowFormSchema buildSalesSchema() {
        return WorkflowFormSchema.builder()
                .documentType("SALES")
                .version(1)
                .title("Sales Order / Quotation Review")
                .description("Commercial quote authorization form")
                .groups(List.of(
                        FormGroup.builder()
                                .id("sales_details")
                                .title("Document & Customer")
                                .fields(List.of(
                                        FormField.builder().name("documentNumber").label("Quote / Order Ref").type("text").readOnly(true).build(),
                                        FormField.builder().name("customerName").label("Customer Name").type("text").required(true).build(),
                                        FormField.builder().name("salesRep").label("Sales Representative").type("text").build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("sales_financials")
                                .title("Pricing & Margin")
                                .fields(List.of(
                                        FormField.builder().name("grossAmount").label("Gross Quotation Value").type("number").required(true).build(),
                                        FormField.builder().name("discountPercent").label("Discount (%)").type("number").defaultValue("0").build(),
                                        FormField.builder().name("netPayable").label("Net Payable Amount").type("number").required(true).build(),
                                        FormField.builder().name("paymentTerms").label("Credit Terms").type("select")
                                                .options(List.of(
                                                        new FieldOption("Immediate", "IMMEDIATE"),
                                                        new FieldOption("30 Days Credit", "CREDIT_30"),
                                                        new FieldOption("Advance", "ADVANCE")
                                                )).build()
                                ))
                                .build()
                ))
                .build();
    }

    private WorkflowFormSchema buildInvoiceSchema() {
        return WorkflowFormSchema.builder()
                .documentType("INVOICE")
                .version(1)
                .title("Invoice Approval Form")
                .description("Verification of customer or vendor billing document")
                .groups(List.of(
                        FormGroup.builder()
                                .id("inv_details")
                                .title("Invoice Overview")
                                .fields(List.of(
                                        FormField.builder().name("documentNumber").label("Invoice Number").type("text").readOnly(true).build(),
                                        FormField.builder().name("invoiceDate").label("Invoice Date").type("date").required(true).build(),
                                        FormField.builder().name("dueDate").label("Payment Due Date").type("date").required(true).build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("inv_amounts")
                                .title("Invoice Totals")
                                .fields(List.of(
                                        FormField.builder().name("subtotal").label("Subtotal").type("number").required(true).build(),
                                        FormField.builder().name("taxAmount").label("Tax Amount").type("number").build(),
                                        FormField.builder().name("grandTotal").label("Grand Total").type("number").required(true).build()
                                ))
                                .build()
                ))
                .build();
    }

    private WorkflowFormSchema buildReimbursementSchema() {
        return WorkflowFormSchema.builder()
                .documentType("REIMBURSEMENT")
                .version(1)
                .title("Employee Reimbursement Form")
                .description("Reimbursement claim details and employee receipts")
                .groups(List.of(
                        FormGroup.builder()
                                .id("reimb_details")
                                .title("Claim Summary")
                                .fields(List.of(
                                        FormField.builder().name("documentNumber").label("Claim Reference").type("text").readOnly(true).build(),
                                        FormField.builder().name("employeeName").label("Employee").type("text").readOnly(true).build(),
                                        FormField.builder().name("claimType").label("Claim Category").type("select").required(true)
                                                .options(List.of(
                                                        new FieldOption("Medical & Health", "MEDICAL"),
                                                        new FieldOption("Travel Allowance", "TRAVEL"),
                                                        new FieldOption("Relocation", "RELOCATION"),
                                                        new FieldOption("Certification & Training", "TRAINING")
                                                )).build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("reimb_amount")
                                .title("Claimed Amount")
                                .fields(List.of(
                                        FormField.builder().name("amount").label("Claim Amount").type("number").required(true).build(),
                                        FormField.builder().name("receiptsAttached").label("Original Receipts Attached").type("checkbox").build(),
                                        FormField.builder().name("purpose").label("Detailed Description").type("textarea").required(true).build()
                                ))
                                .build()
                ))
                .build();
    }

    private WorkflowFormSchema buildGeneralSchema(String docType) {
        return WorkflowFormSchema.builder()
                .documentType(docType)
                .version(1)
                .title(docType + " Workflow Form")
                .description("Generic dynamic workflow review form for document type: " + docType)
                .groups(List.of(
                        FormGroup.builder()
                                .id("general_info")
                                .title("Document Information")
                                .fields(List.of(
                                        FormField.builder().name("documentNumber").label("Document Reference").type("text").readOnly(true).build(),
                                        FormField.builder().name("documentType").label("Document Type").type("text").readOnly(true).build(),
                                        FormField.builder().name("initiatedByName").label("Initiated By").type("text").readOnly(true).build()
                                ))
                                .build(),
                        FormGroup.builder()
                                .id("general_details")
                                .title("Details & Justification")
                                .fields(List.of(
                                        FormField.builder().name("title").label("Subject / Title").type("text").required(true).build(),
                                        FormField.builder().name("purpose").label("Description & Justification").type("textarea").required(true).build(),
                                        FormField.builder().name("priority").label("Priority").type("select").defaultValue("MEDIUM")
                                                .options(List.of(
                                                        new FieldOption("Low", "LOW"),
                                                        new FieldOption("Medium", "MEDIUM"),
                                                        new FieldOption("High", "HIGH"),
                                                        new FieldOption("Urgent", "URGENT")
                                                )).build()
                                ))
                                .build()
                ))
                .build();
    }
}
