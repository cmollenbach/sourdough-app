/**
 * FormSkeleton Component
 * 
 * Loading skeleton for forms to prevent race conditions
 * and improve perceived performance.
 */
export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-72 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  );
}

