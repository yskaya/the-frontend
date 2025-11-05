import { useState, useEffect } from 'react';

/**
 * Hook to detect window visibility and handle focus/blur events
 * Returns true when window/tab is visible and active
 */
export function useWindowVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleFocus = () => {
      setIsVisible(true);
    };

    const handleBlur = () => {
      setIsVisible(false);
    };

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
