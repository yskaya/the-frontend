/**
 * Server-side authentication helpers for getServerSideProps
 * These functions run on the server and handle auth validation before page renders
 */

import { GetServerSidePropsContext } from 'next';
import type { User } from './auth.types';

/**
 * Validates user authentication on the server side
 * Returns user data if authenticated, null if not
 */
export async function validateServerAuth(
  context: GetServerSidePropsContext
): Promise<User | null> {
  try {
    // Get cookies from the request
    const cookies = context.req.headers.cookie || '';
    console.log('[Server Auth] Received cookies:', cookies ? cookies.substring(0, 150) + '...' : 'NONE');
    
    // If no cookies, user is not authenticated
    // Backend uses snake_case: access_token
    if (!cookies.includes('access_token')) {
      console.log('[Server Auth] ❌ No access_token found in cookies');
      return null;
    }

    console.log('[Server Auth] ✅ accessToken found, validating...');

    // Call your auth API to validate
    // Gateway has /api prefix, so we add it here
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, '');
    // Add /api only if not already present
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    const fullUrl = `${baseUrl}/users/me`;
    const response = await fetch(fullUrl, {
      headers: {
        Cookie: cookies,
      },
      credentials: 'include',
    });

    console.log('[Server Auth] Validation API response status:', response.status);

    if (!response.ok) {
      console.log('[Server Auth] ❌ Validation failed');
      return null;
    }

    const data = await response.json();
    console.log('[Server Auth] API returned:', data);
    
    // Backend returns { user: {...} }, we need to unwrap it
    const user = data.user || data;
    
    if (!user || !user.email) {
      console.log('[Server Auth] ❌ Invalid user data');
      return null;
    }
    
    console.log('[Server Auth] ✅ User validated:', user.email);
    return user as User;
  } catch (error) {
    console.error('[Server Auth] ❌ Error:', error);
    return null;
  }
}

/**
 * Protects a page - redirects to login if not authenticated
 * Use in getServerSideProps for protected pages
 */
export async function requireAuth(context: GetServerSidePropsContext) {
  const user = await validateServerAuth(context);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
}

/**
 * Redirects to dashboard if already authenticated
 * Use in getServerSideProps for login/register pages
 */
export async function redirectIfAuthenticated(context: GetServerSidePropsContext) {
  const user = await validateServerAuth(context);
  console.log('[Login Page Server] User check result:', user ? 'logged in' : 'not logged in');

  if (user) {
    console.log('[Login Page Server] Redirecting to dashboard');
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  console.log('[Login Page Server] Showing login page');
  return {
    props: {},
  };
}

