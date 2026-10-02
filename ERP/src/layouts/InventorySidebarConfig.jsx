import { Boxes } from "lucide-react";
import { INVENTORY_SIDEBAR, buildFilteredSidebar } from "../features/inventory/config/inventorySidebarConfig";

/**
 * Builds the Inventory Management sidebar links, filtered by user RBAC.
 * Mirrors the pattern used by buildAccountantSidebarLinks for Accounts.
 *
 * @param {string} userRole - current user role (not used for filtering — only modules matter)
 * @param {Function} canAccess - (module, action) => boolean, from useRBAC
 * @returns {Array} sidebar link tree (empty array if user has no inventory modules)
 */
export function buildInventorySidebarLinks(userRole, canAccess) {
  const filtered = buildFilteredSidebar(INVENTORY_SIDEBAR, (module, action) => {
    if (!module) return true;
    return canAccess(module, action);
  });

  if (filtered.length === 0) return [];

  return [{
    id: "inventory",
    label: "Inventory Management",
    icon: Boxes,
    path: "/inventory/dashboard",
    children: filtered,
  }];
}
