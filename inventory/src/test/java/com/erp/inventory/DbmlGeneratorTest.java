package com.erp.inventory;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.Attribute;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.FileWriter;
import java.io.IOException;
import java.util.Set;

@SpringBootTest
public class DbmlGeneratorTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    public void generateDbml() throws IOException {
        StringBuilder dbml = new StringBuilder();
        Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();

        for (EntityType<?> entity : entities) {
            String tableName = entity.getName().replaceAll("([a-z])([A-Z]+)", "$1_").toLowerCase();
            // JPA entity.getName() usually returns the class name. Let's make it snake case.
            
            dbml.append("Table ").append(tableName).append(" {\n");

            for (Attribute<?, ?> attribute : entity.getAttributes()) {
                String colName = attribute.getName().replaceAll("([a-z])([A-Z]+)", "$1_").toLowerCase();
                String type = attribute.getJavaType().getSimpleName().toLowerCase();

                // Map Java types to DBML types
                if (type.contains("string")) type = "varchar";
                else if (type.contains("int")) type = "integer";
                else if (type.contains("long")) type = "bigint";
                else if (type.contains("bigdecimal")) type = "numeric";
                else if (type.contains("uuid")) type = "uuid";
                else if (type.contains("boolean")) type = "boolean";
                else if (type.contains("date") || type.contains("time")) type = "timestamp";
                else type = "varchar";

                String options = attribute.getName().equals("id") ? " [pk]" : "";
                dbml.append("  ").append(colName).append(" ").append(type).append(options).append("\n");
            }
            dbml.append("}\n\n");
        }

        try (FileWriter writer = new FileWriter("schema.dbml")) {
            writer.write(dbml.toString().replace("", ""));
        }
    }
}
