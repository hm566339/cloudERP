import { Calculator } from "lucide-react";
import { FINANCE_SIDEBAR, buildFilteredSidebar } from "../features/account/config/financeSidebarConfig";
import { ROLES } from "../utils/rbac";

export function buildAccountantSidebarLinks(userRole, canAccess) {
  const base = "/accounts";
  const filtered = buildFilteredSidebar(FINANCE_SIDEBAR, (module, action) => {
    if (!module) return true;
    return canAccess(module, action);
  });

  if (filtered.length === 0) return [];

  return [{
    id: "finance",
    label: "Accounts",
    icon: Calculator,
    path: `${base}/dashboard`,
    children: filtered,
  }];
}
