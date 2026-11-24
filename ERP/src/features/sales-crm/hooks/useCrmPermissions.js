import { useAppSelector } from '../../../app/hooks';
import {
  hasPermission,
  isOwnerUser,
  isSystemAdminUser,
} from '../../../utils/moduleNormalization';

/**
 * Custom hook providing SSO and RBAC permission checks specifically for Sales & CRM modules.
 * Honors ROLE_OWNER, ROLE_SYSTEM_ADMIN, CRM:MANAGE overrides seamlessly.
 */
export function useCrmPermissions() {
  const authState = useAppSelector((state) => state.auth || state);

  const isOwner = isOwnerUser(authState);
  const isSysAdmin = isSystemAdminUser(authState);

  // Check if user has CRM:MANAGE global override
  const hasCrmManage = isSysAdmin || isOwner || hasPermission(authState, 'CRM', 'MANAGE', 'CRM') || hasPermission(authState, 'CRM:MANAGE');

  /**
   * Check if a specific CRM feature action is permitted.
   * @param {string} featureCode - e.g. 'CRM_LEADS', 'CRM_ACCOUNTS'
   * @param {string} action - e.g. 'CREATE', 'READ', 'UPDATE', 'DELETE', 'ASSIGN', 'CONVERT'
   * @returns {boolean}
   */
  const can = (featureCode, action) => {
    if (isSysAdmin || isOwner || hasCrmManage) return true;
    return hasPermission(authState, featureCode, action, 'CRM');
  };

  return {
    isOwner,
    isSysAdmin,
    hasCrmManage,
    can,

    // Module-specific quick helpers
    leads: {
      canCreate: can('CRM_LEADS', 'CREATE'),
      canRead: can('CRM_LEADS', 'READ'),
      canUpdate: can('CRM_LEADS', 'UPDATE'),
      canDelete: can('CRM_LEADS', 'DELETE'),
      canAssign: can('CRM_LEADS', 'ASSIGN'),
      canMerge: can('CRM_LEADS', 'MERGE'),
      canConvert: can('CRM_LEADS', 'CONVERT'),
      canImport: can('CRM_LEADS', 'IMPORT'),
      canExport: can('CRM_LEADS', 'EXPORT'),
    },
    accounts: {
      canCreate: can('CRM_ACCOUNTS', 'CREATE'),
      canRead: can('CRM_ACCOUNTS', 'READ'),
      canUpdate: can('CRM_ACCOUNTS', 'UPDATE'),
      canDelete: can('CRM_ACCOUNTS', 'DELETE'),
      canOnboard: can('CRM_ACCOUNTS', 'ONBOARD'),
      canExport: can('CRM_ACCOUNTS', 'EXPORT'),
    },
    contacts: {
      canCreate: can('CRM_ACCOUNTS', 'CREATE'),
      canRead: can('CRM_ACCOUNTS', 'READ'),
      canUpdate: can('CRM_ACCOUNTS', 'UPDATE'),
      canDelete: can('CRM_ACCOUNTS', 'DELETE'),
      canExport: can('CRM_ACCOUNTS', 'EXPORT'),
    },
    opportunities: {
      canCreate: can('CRM_OPPORTUNITIES', 'CREATE'),
      canRead: can('CRM_OPPORTUNITIES', 'READ'),
      canUpdate: can('CRM_OPPORTUNITIES', 'UPDATE'),
      canDelete: can('CRM_OPPORTUNITIES', 'DELETE'),
      canClose: can('CRM_OPPORTUNITIES', 'CLOSE'),
      canExport: can('CRM_OPPORTUNITIES', 'EXPORT'),
    },
    quotations: {
      canCreate: can('CRM_QUOTATIONS', 'CREATE'),
      canRead: can('CRM_QUOTATIONS', 'READ'),
      canUpdate: can('CRM_QUOTATIONS', 'UPDATE'),
      canDelete: can('CRM_QUOTATIONS', 'DELETE'),
      canSubmitApproval: can('CRM_QUOTATIONS', 'SUBMIT_APPROVAL'),
      canApprove: can('CRM_QUOTATIONS', 'APPROVE'),
      canConvertOrder: can('CRM_QUOTATIONS', 'CONVERT_ORDER'),
      canExport: can('CRM_QUOTATIONS', 'EXPORT'),
    },
    activities: {
      canCreate: can('CRM_ACTIVITIES', 'CREATE'),
      canRead: can('CRM_ACTIVITIES', 'READ'),
      canUpdate: can('CRM_ACTIVITIES', 'UPDATE'),
      canDelete: can('CRM_ACTIVITIES', 'DELETE'),
      canComplete: can('CRM_ACTIVITIES', 'COMPLETE'),
    },
    communications: {
      canCreate: can('CRM_COMMUNICATION', 'CREATE'),
      canSend: can('CRM_COMMUNICATION', 'SEND'),
      canRead: can('CRM_COMMUNICATION', 'READ'),
    },
    campaigns: {
      canCreate: can('CRM_CAMPAIGNS', 'CREATE'),
      canRead: can('CRM_CAMPAIGNS', 'READ'),
      canUpdate: can('CRM_CAMPAIGNS', 'UPDATE'),
      canDelete: can('CRM_CAMPAIGNS', 'DELETE'),
      canExport: can('CRM_CAMPAIGNS', 'EXPORT'),
    },
    integrations: {
      canCreate: can('CRM_INTEGRATIONS', 'CREATE'),
      canRead: can('CRM_INTEGRATIONS', 'READ'),
      canUpdate: can('CRM_INTEGRATIONS', 'UPDATE'),
      canDelete: can('CRM_INTEGRATIONS', 'DELETE'),
      canExecute: can('CRM_INTEGRATIONS', 'EXECUTE'),
    },
    automation: {
      canCreate: can('CRM_AUTOMATION', 'CREATE'),
      canRead: can('CRM_AUTOMATION', 'READ'),
      canUpdate: can('CRM_AUTOMATION', 'UPDATE'),
      canDelete: can('CRM_AUTOMATION', 'DELETE'),
      canManage: can('CRM_AUTOMATION', 'MANAGE'),
      canExecute: can('CRM_AUTOMATION', 'EXECUTE'),
    },
    settings: {
      canManage: can('CRM_SETTINGS', 'MANAGE') || hasCrmManage,
    },
  };
}

export default useCrmPermissions;
