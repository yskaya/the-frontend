/**
 * Server-side authentication helpers for getServerSideProps
 * These functions run on the server and handle auth validation before page renders
 */

import { GetServerSidePropsContext } from 'next';
import type { User } from './types';

/**
 * Validates user authentication on the server side
 * Returns user data if authenticated, null if not
 */
function normalizeBaseUrl(url: string) {
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function resolveUsersServiceBaseUrls(): string[] {
  const configured = process.env.NEXT_PUBLIC_USERS_SERVICE_URL || 'http://localhost:5002';
  const internal =
    process.env.USERS_SERVICE_INTERNAL_URL ||
    process.env.USERS_SERVICE_URL ||
    configured.replace('localhost', '127.0.0.1');

  const candidates = [internal, configured].map((url) => normalizeBaseUrl(url));
  return Array.from(new Set(candidates));
}

export async function validateServerAuth(
  context: GetServerSidePropsContext
): Promise<User | null> {
  try {
    const cookies = context.req.headers.cookie || '';
    console.log('[Server Auth] Received cookies:', cookies ? cookies.substring(0, 150) + '...' : 'NONE');

    const authHeader = context.req.headers.authorization;
    const hasAuthHeader = authHeader && authHeader.startsWith('Bearer ');
    console.log('[Server Auth] Authorization header:', hasAuthHeader ? 'PRESENT' : 'NOT PRESENT');

    const hasAccessTokenInCookies = cookies.includes('access_token');
    if (!hasAccessTokenInCookies && !hasAuthHeader) {
      console.log('[Server Auth] ❌ No access_token in cookies and no Authorization header');
      return null;
    }

    console.log('[Server Auth] ✅ Token found (cookies or Authorization header), validating...');

    const baseUrls = resolveUsersServiceBaseUrls();
    let lastError: unknown = null;

    const headers: Record<string, string> = {};
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    if (hasAuthHeader && authHeader) {
      headers['Authorization'] = authHeader;
    }

    for (const baseUrl of baseUrls) {
      const fullUrl = `${baseUrl}/users/me`;
      try {
        const response = await fetch(fullUrl, {
          headers,
          credentials: 'include',
        });

        console.log('[Server Auth] Validation API response status:', response.status, 'via', baseUrl);

        if (!response.ok) {
          if (response.status >= 500) {
            lastError = new Error(`Users service returned ${response.status} for ${baseUrl}`);
            continue;
          }
          console.log('[Server Auth] ❌ Validation failed');
          return null;
        }

        const data = await response.json();
        console.log('[Server Auth] API returned:', data);

        const user = data.user || data;

        if (!user || !user.email) {
          console.log('[Server Auth] ❌ Invalid user data');
          return null;
        }

        console.log('[Server Auth] ✅ User validated:', user.email);
        return user as User;
      } catch (error) {
        console.error(`[Server Auth] ❌ Error calling ${baseUrl}:`, error);
        lastError = error;
        continue;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return null;
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
  const method = context.req.method?.toUpperCase();
  const hasLogoutFlag = context.query.logout === '1';
  const isBrowserLogout = method === 'GET' && hasLogoutFlag;

  if (isBrowserLogout) {
    console.log('[Login Page Server] Logout flag detected, clearing session cookies');
    context.res.setHeader('Set-Cookie', [
      'access_token=; Max-Age=0; Path=/; HttpOnly',
      'refresh_token=; Max-Age=0; Path=/; HttpOnly',
      'user_id=; Max-Age=0; Path=/',
    ]);
  }

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

