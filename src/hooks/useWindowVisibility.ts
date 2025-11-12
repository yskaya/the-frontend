import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to detect window visibility and handle focus/blur events
 * Returns true when window/tab is visible and active
 */
export function useWindowVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  const handleVisibilityChange = useCallback(() => {
    setIsVisible(!document.hidden);
  }, []);

  const handleFocus = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Listen to visibility API (works when tab is switched)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen to window focus/blur (works when window loses focus)
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Initialize state
    setIsVisible(!document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isVisible;
}
