package com.erp.inventory.common.security.annotation;

import java.lang.annotation.*;

/**
 * Annotation for declarative Feature-Based Access Control (FBAC).
 *
 * Can be applied to methods or controller classes to require specific
 * active feature permissions for the authenticated user.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireFeature {

    /**
     * Unique code of the required feature (e.g. "STOCK", "REPORTS", "DASHBOARD").
     */
    String value();
}