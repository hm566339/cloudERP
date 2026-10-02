package com.erp.account.modules.apinvoice.validator;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ApInvoiceItemValidator implements ConstraintValidator<ValidApInvoiceItem, ApInvoiceItemRequest> {

    @Override
    public boolean isValid(ApInvoiceItemRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }

        boolean isValid = true;
        context.disableDefaultConstraintViolation();

        if (request.getItemType() == null) {
            // Handled by @NotNull on the field itself, but just in case
            return true;
        }

        if (ItemType.PRODUCT.equals(request.getItemType())) {
            if (request.getItemId() == null) {
                isValid = false;
                addViolation(context, "itemId", "itemId is required for PRODUCT");
            }
            if (request.getWarehouseId() == null) {
                isValid = false;
                addViolation(context, "warehouseId", "warehouseId is required for PRODUCT");
            }
            if (request.getLocationId() == null) {
                isValid = false;
                addViolation(context, "locationId", "locationId is required for PRODUCT");
            }
        } else if (ItemType.EXPENSE.equals(request.getItemType())) {
            if (request.getExpenseAccountId() == null) {
                isValid = false;
                addViolation(context, "expenseAccountId", "expenseAccountId is required for EXPENSE");
            }
        }

        return isValid;
    }

    private void addViolation(ConstraintValidatorContext context, String field, String message) {
        context.buildConstraintViolationWithTemplate(message)
                .addPropertyNode(field)
                .addConstraintViolation();
    }
}
