import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const DEFAULT_USERS_URL = process.env.NEXT_PUBLIC_USERS_SERVICE_URL || 'http://localhost:5002';
const DEFAULT_WALLET_URL = process.env.NEXT_PUBLIC_WALLET_SERVICE_URL || 'http://localhost:5006';

function normalizeBaseUrl(url: string) {
  let apiUrl = url || '';
  apiUrl = apiUrl.replace(/\/$/, '');
  return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
}

export class ApiClient {
  public client: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;
  private errorHandler?: (error: unknown, context?: string) => void;

  constructor(baseUrl: string = DEFAULT_USERS_URL) {
    const baseURL = normalizeBaseUrl(baseUrl);

    this.client = axios.create({
      baseURL,
      withCredentials: true, // Important for cookies
      timeout: 60000, // 60 seconds for login operations (includes OAuth + multiple service calls + network latency)
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  // Method to set error handler
  setErrorHandler(handler: (error: unknown, context?: string) => void) {
    this.errorHandler = handler;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Don't add x-user-id header for auth/login endpoints (user not authenticated yet)
        const isAuthLogin = config.url?.includes('/auth/login') || config.url?.includes('/auth/logout');
        if (isAuthLogin) {
          // Remove x-user-id if it was set elsewhere
          delete config.headers['x-user-id'];
          return config;
        }

        // Add Authorization header with token from localStorage if cookies are blocked
        // This is a fallback for cross-origin cookie blocking
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('access_token');
          if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
            console.log('[ApiClient] Added Authorization header with token from localStorage');
          }
        }
        
        // Add user ID header for backend microservices
        // Get from cookies first, then localStorage as fallback (for cross-origin cookie blocking)
        let userId: string | null = null;
        const cookies = document.cookie;
        const userIdMatch = cookies.match(/user_id=([^;]+)/);
        userId = userIdMatch ? userIdMatch[1] : null;
        
        // Fallback to localStorage if cookies are blocked
        if (!userId && typeof window !== 'undefined') {
          userId = localStorage.getItem('user_id');
        }
        
        // Only add x-user-id if we have a real userId (not for login/logout)
        if (userId) {
          config.headers['x-user-id'] = userId;
        } else {
          // Don't add x-user-id if no userId - let backend handle it
          delete config.headers['x-user-id'];
        }
        return config;
      },
      (error: AxiosError) => {
        console.log('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => Promise.reject(error)
    );
  }

  // API methods
  async get<T>(url: string, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error, options?.silent);
    }
  }

  async post<T>(url: string, data?: unknown, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    try {
      console.log(`[ApiClient] POST ${url}`, { data });
      const response = await this.client.post<T>(url, data);
      console.log(`[ApiClient] POST ${url} - Success:`, response.status);
      return { data: response.data };
    } catch (error) {
      console.error(`[ApiClient] POST ${url} - Error:`, error);
      return this.handleError(error, options?.silent);
    }
  }

  async patch<T>(url: string, data?: unknown, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data);
      return { data: response.data };
    } catch (error) {
      return this.handleError(error, options?.silent);
    }
  }

  async delete<T>(url: string, data?: unknown, options?: { silent?: boolean }): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url, { data });
      return { data: response.data };
    } catch (error) {
      return this.handleError(error, options?.silent);
    }
  }

  private handleError(error: unknown, silent = false): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      // Log detailed error information
      console.error('[ApiClient] Axios Error Details:', {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      
      // Check for rate limit errors (429)
      if (axiosError.response?.status === 429) {
        const apiError = axiosError.response?.data;
        const errorMessage = apiError?.message || 'Rate limit exceeded. Please wait a moment and try again.';
        
        // Use error handler if available to show notifications (unless silent)
        if (!silent && this.errorHandler) {
          this.errorHandler(axiosError);
        }
        
        return { error: errorMessage };
      }
      
      if (axiosError.response?.status === 401) {
        console.debug('[ApiClient] 401 detected');
      }

      // Use error handler if available to show notifications (unless silent)
      if (!silent && this.errorHandler) {
        this.errorHandler(axiosError);
      }
      
      const apiError = axiosError.response?.data;
      const errorMessage = apiError?.message || axiosError.message || 'Request failed';
      
      // Return error response instead of throwing
      // This prevents ErrorBoundary from catching API errors
      return { error: errorMessage };
    }
    
    // Use error handler if available (unless silent)
    if (!silent && this.errorHandler) {
      this.errorHandler(error);
    }
    
    console.error('[ApiClient] Non-Axios Error:', error);
    const errorMessage = 'An unexpected error occurred';
    // Return error response instead of throwing
    return { error: errorMessage };
  }
}

export const api = new ApiClient();
export const usersApi = api;
export const walletApi = new ApiClient(DEFAULT_WALLET_URL);

