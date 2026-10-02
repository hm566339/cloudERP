import { useParams } from 'react-router-dom';
import { useRBAC } from '../utils/rbac';

export function useRoutePath() {
  const { companyId } = useParams();
  const { isSuperAdmin, isCompanyAdmin } = useRBAC();

  return {
    buildPath: (path) => {
      if (!path) return path;
      
      // Clean leading slash for consistency
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      // Determine if we are in a company-scoped admin view
      const isAdmin = isSuperAdmin || isCompanyAdmin;
      
      if (isAdmin && companyId) {
        return `/company/${companyId}/${cleanPath}`;
      }
      
      // Regular tenant-scoped route
      return `/${cleanPath}`;
    }
  };
}
