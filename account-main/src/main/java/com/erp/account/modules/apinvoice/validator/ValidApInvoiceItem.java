package com.erp.account.modules.apinvoice.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = ApInvoiceItemValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidApInvoiceItem {
    String message() default "Invalid AP Invoice Item configuration";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
