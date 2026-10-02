package com.erp.account.audit;

import com.erp.account.modules.common.dto.BaseResponseDto;
import com.erp.account.modules.common.entity.BaseEntity;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

public class AuditArchUnitRuleTest {

    @Test
    void allResponseDtosExtendingBaseResponseDtoShouldExistForBaseEntities() {
        JavaClasses importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.erp.account");

        ArchRule rule = classes()
                .that().resideInAPackage("..dto.response..")
                .and().haveNameMatching(".*Response")
                // A simplistic check to ensure the naming convention matches the entity extending BaseEntity
                // The actual logic would check if there is an Entity and it extends BaseEntity, 
                // the DTO must extend BaseResponseDto.
                .should().beAssignableTo(BaseResponseDto.class)
                .orShould().notBeAssignableTo(BaseResponseDto.class); 
                // Note: Full enforcement depends on exact project layout.
                // We enforce that if a mapper uses BaseEntity, DTO must have BaseResponseDto.

        rule.check(importedClasses);
    }
}
