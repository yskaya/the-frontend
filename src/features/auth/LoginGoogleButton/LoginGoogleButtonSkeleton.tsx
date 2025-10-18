import React from 'react';

/**
 * Loading skeleton for LoginGoogleButton
 * Matches the button's exact styling to prevent layout shift
 */
export const LoginGoogleButtonSkeleton: React.FC<{ children?: React.ReactNode }> = ({ 
  children = "Login with Google" 
}) => {
  return (
    <div className="rounded-full border border-solid border-gray-300 flex items-center justify-center bg-gray-200 text-transparent gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 animate-pulse cursor-not-allowed">
      {children}
    </div>
  );
};

