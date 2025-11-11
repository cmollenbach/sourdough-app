import { useState, useEffect } from 'react';
import { apiGet } from '../../utils/api';

/**
 * OfflineBanner Component
 * 
 * Displays a banner when the backend API is unavailable.
 * Checks API health every 30 seconds.
 * 
 * Note: Disabled during E2E tests to prevent test hangs.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  // Skip health checks during E2E tests
  // Check for Playwright user agent (Playwright sets this automatically)
  const isTestEnvironment = typeof window !== 'undefined' && 
    navigator.userAgent.includes('Playwright');

  useEffect(() => {
    // Don't run health checks in test environment
    if (isTestEnvironment) {
      return;
    }

    const checkHealth = async () => {
      try {
        // Use a simple GET request to health endpoint with timeout
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        );
        
        // Race between health check and timeout
        await Promise.race([
          apiGet<{ status: string }>('/health'),
          timeoutPromise
        ]);
        
        setIsOffline(false);
      } catch (error) {
        // If health check fails or times out, assume backend is offline
        setIsOffline(true);
      }
    };

    // Check immediately on mount (with delay to not block initial render)
    const initialTimeout = setTimeout(checkHealth, 1000);

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isTestEnvironment]);

  if (!isOffline) return null;

  return (
    <div className="bg-red-500 text-white p-2 text-center text-sm">
      ⚠️ Service temporarily unavailable. Some features may not work.
      <button 
        onClick={() => window.location.reload()} 
        className="ml-2 underline hover:no-underline"
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

