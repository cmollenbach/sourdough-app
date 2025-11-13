import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet } from '../../utils/api';

const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 5 * 60 * 1000;

/**
 * OfflineBanner Component
 * 
 * Displays a banner when the backend API is unavailable.
 * Checks API health with graceful backoff to avoid tight polling on mobile.
 * 
 * Note: Disabled during E2E tests to prevent test hangs.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Skip health checks during E2E tests
  // Check for Playwright user agent (Playwright sets this automatically)
  const isTestEnvironment = typeof window !== 'undefined' && 
    navigator.userAgent.includes('Playwright');

  const retryDelayRef = useRef(BASE_DELAY_MS); // start at 30s
  const timeoutRef = useRef<number | null>(null);

  const clearScheduledCheck = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const runHealthCheck = useCallback(async () => {
    if (isTestEnvironment) {
      return;
    }

    clearScheduledCheck();
    setIsChecking(true);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      );

      await Promise.race([
        apiGet<{ status: string }>('/health'),
        timeoutPromise
      ]);

      retryDelayRef.current = BASE_DELAY_MS;
      setIsOffline(false);
      timeoutRef.current = window.setTimeout(() => {
        void runHealthCheck();
      }, retryDelayRef.current);
    } catch (error) {
      setIsOffline(true);
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_DELAY_MS);
      timeoutRef.current = window.setTimeout(() => {
        void runHealthCheck();
      }, retryDelayRef.current);
    } finally {
      setIsChecking(false);
    }
  }, [clearScheduledCheck, isTestEnvironment]);

  useEffect(() => {
    if (isTestEnvironment) {
      return;
    }

    // Kick off the initial check after first render to avoid layout jank
    timeoutRef.current = window.setTimeout(() => {
      void runHealthCheck();
    }, 1000);

    return () => {
      clearScheduledCheck();
    };
  }, [clearScheduledCheck, isTestEnvironment, runHealthCheck]);

  if (!isOffline) return null;

  return (
    <div className="bg-danger-600 text-danger-50" role="status" aria-live="assertive">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 font-medium">
          <span aria-hidden="true">⚠️</span>
          Service temporarily unavailable. Some features may not work.
        </span>
        <div className="inline-flex items-center gap-3">
          <span className="text-xs text-danger-100">
            We'll retry in {Math.round(retryDelayRef.current / 1000)}s
          </span>
          <button
            onClick={() => {
              retryDelayRef.current = BASE_DELAY_MS;
              void runHealthCheck();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-danger-200 bg-danger-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-danger-50 transition hover:bg-danger-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-200"
            type="button"
            disabled={isChecking}
          >
            {isChecking ? 'Checking…' : 'Retry now'}
          </button>
        </div>
      </div>
    </div>
  );
}

