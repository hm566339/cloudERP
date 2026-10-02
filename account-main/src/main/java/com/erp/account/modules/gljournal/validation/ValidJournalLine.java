package com.erp.account.modules.gljournal.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = ValidJournalLineValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidJournalLine {
    String message() default "Journal line must have exactly one positive amount: either debit or credit";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
