package com.erp.auth_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Production Schema & JPA Entity Mapping Verification: OrganizationAppearance")
class OrganizationAppearanceSchemaAndMappingTest {

    @Test
    @DisplayName("Verify JPA Entity Table & Annotations")
    void testEntityAnnotations() {
        assertTrue(OrganizationAppearance.class.isAnnotationPresent(Entity.class),
                "OrganizationAppearance must be annotated with @Entity");

        Table table = OrganizationAppearance.class.getAnnotation(Table.class);
        assertNotNull(table, "@Table annotation must be present");
        assertEquals("organization_appearance", table.name(),
                "Table name must match 'organization_appearance'");
    }

    @Test
    @DisplayName("Verify custom_palette JPA mapping and type")
    void testCustomPaletteMapping() throws NoSuchFieldException {
        Field field = OrganizationAppearance.class.getDeclaredField("customPalette");
        assertEquals(String.class, field.getType(), "customPalette field must be java.lang.String");

        Column column = field.getAnnotation(Column.class);
        assertNotNull(column, "@Column annotation must be present on customPalette");
        assertEquals("custom_palette", column.name(), "Column name must be 'custom_palette'");
        assertEquals("TEXT", column.columnDefinition(), "Column definition must be 'TEXT' for compatibility");
    }

    @Test
    @DisplayName("Verify all entity columns match migration definitions")
    void testAllEntityColumnsMapped() {
        Map<String, String> expectedColumns = Map.ofEntries(
                Map.entry("activeTheme", "active_theme"),
                Map.entry("appearanceMode", "appearance_mode"),
                Map.entry("layoutDensity", "layout_density"),
                Map.entry("fontFamily", "font_family"),
                Map.entry("sidebarDefaultState", "sidebar_default_state"),
                Map.entry("contentWidth", "content_width"),
                Map.entry("borderRadius", "border_radius"),
                Map.entry("cardShadow", "card_shadow"),
                Map.entry("tableDensity", "table_density"),
                Map.entry("baseFontSize", "base_font_size"),
                Map.entry("lightLogoUrl", "light_logo_url"),
                Map.entry("darkLogoUrl", "dark_logo_url"),
                Map.entry("faviconUrl", "favicon_url"),
                Map.entry("customOverridesEnabled", "custom_overrides_enabled"),
                Map.entry("customPalette", "custom_palette"),
                Map.entry("primaryColor", "primary_color"),
                Map.entry("secondaryColor", "secondary_color"),
                Map.entry("accentColor", "accent_color"),
                Map.entry("createdAt", "created_at"),
                Map.entry("updatedAt", "updated_at")
        );

        for (Map.Entry<String, String> entry : expectedColumns.entrySet()) {
            try {
                Field f = OrganizationAppearance.class.getDeclaredField(entry.getKey());
                Column col = f.getAnnotation(Column.class);
                assertNotNull(col, "Field " + entry.getKey() + " must have @Column");
                assertEquals(entry.getValue(), col.name(),
                        "Field " + entry.getKey() + " must map to column " + entry.getValue());
            } catch (NoSuchFieldException e) {
                fail("Missing field in OrganizationAppearance: " + entry.getKey());
            }
        }
    }

    @Test
    @DisplayName("Verify V14 migration SQL file exists and contains all required column definitions")
    void testMigrationV14FileContent() throws Exception {
        String resourcePath = "/db/migration/V14__add_missing_organization_appearance_custom_palette.sql";
        try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
            assertNotNull(is, "Migration file must be present on classpath at " + resourcePath);
            String sql = new String(is.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();

            // Verify core table and column statements
            assertTrue(sql.contains("organization_appearance"), "Migration must reference organization_appearance");
            assertTrue(sql.contains("custom_palette"), "Migration must add custom_palette column");
            assertTrue(sql.contains("custom_overrides_enabled"), "Migration must add custom_overrides_enabled");
            assertTrue(sql.contains("sidebar_default_state"), "Migration must add sidebar_default_state");
            assertTrue(sql.contains("content_width"), "Migration must add content_width");
            assertTrue(sql.contains("border_radius"), "Migration must add border_radius");
            assertTrue(sql.contains("card_shadow"), "Migration must add card_shadow");
            assertTrue(sql.contains("table_density"), "Migration must add table_density");
            assertTrue(sql.contains("base_font_size"), "Migration must add base_font_size");
            assertTrue(sql.contains("light_logo_url"), "Migration must add light_logo_url");
            assertTrue(sql.contains("dark_logo_url"), "Migration must add dark_logo_url");
            assertTrue(sql.contains("favicon_url"), "Migration must add favicon_url");
            assertTrue(sql.contains("primary_color"), "Migration must add primary_color");
            assertTrue(sql.contains("secondary_color"), "Migration must add secondary_color");
            assertTrue(sql.contains("accent_color"), "Migration must add accent_color");
        }
    }

    @Test
    @DisplayName("Verify JSON customPalette serialization & builder defaults")
    void testEntityCustomPaletteJsonHandling() {
        OrganizationAppearance appearance = OrganizationAppearance.builder()
                .activeTheme("ocean_blue")
                .appearanceMode("dark")
                .customOverridesEnabled(true)
                .customPalette("{\"primary\":\"#2E3D28\",\"secondary\":\"#A9B887\",\"background\":\"#101411\"}")
                .build();

        assertNotNull(appearance.getCustomPalette());
        assertTrue(appearance.getCustomPalette().contains("\"primary\":\"#2E3D28\""));
        assertEquals("ocean_blue", appearance.getActiveTheme());
        assertEquals("dark", appearance.getAppearanceMode());
        assertTrue(appearance.getCustomOverridesEnabled());

        // Default layout properties
        assertEquals("expanded", appearance.getSidebarDefaultState());
        assertEquals("standard", appearance.getContentWidth());
        assertEquals("medium", appearance.getBorderRadius());
        assertEquals("comfortable", appearance.getTableDensity());
        assertEquals("default", appearance.getBaseFontSize());
        assertTrue(appearance.getCardShadow());
    }
}

