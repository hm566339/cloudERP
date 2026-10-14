import { PageLoader } from '../components/common/SkeletonLoader';

/**
 * Shown while a lazy-loaded route chunk is being fetched.
 * Extracted from AppRoutes.jsx.
 */
export default function RouteLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white/50">
      <PageLoader message="Loading page…" />
    </div>
  );
}
