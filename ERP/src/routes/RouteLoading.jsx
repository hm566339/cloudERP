import { PageLoader } from '../components/common/SkeletonLoader';

/**
 * Shown while a lazy-loaded route chunk is being fetched.
 * Extracted from AppRoutes.jsx.
 */
export default function RouteLoading() {
  return <PageLoader message="Loading page…" />;
}
