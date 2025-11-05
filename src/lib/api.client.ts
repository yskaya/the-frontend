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

export class ApiClient {
  public client: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;
  private errorHandler?: (error: unknown, context?: string) => void;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555',
      withCredentials: true, // Important for cookies
      timeout: 10000,
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
        // Add user ID header for backend microservices
        // Get from cookies if available (set during login)
        const cookies = document.cookie;
        const userIdMatch = cookies.match(/user_id=([^;]+)/);
        const userId = userIdMatch ? userIdMatch[1] : 'test-user-1'; // Fallback for testing
        config.headers['x-user-id'] = userId;
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
      const response = await this.client.post<T>(url, data);
      return { data: response.data };
    } catch (error) {
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
      
      // Use error handler if available to show notifications (unless silent)
      if (!silent && this.errorHandler) {
        this.errorHandler(axiosError);
      }
      
      const apiError = axiosError.response?.data;
      const errorMessage = apiError?.message || 'Request failed';
      
      // Return error response instead of throwing
      // This prevents ErrorBoundary from catching API errors
      return { error: errorMessage };
    }
    
    // Use error handler if available (unless silent)
    if (!silent && this.errorHandler) {
      this.errorHandler(error);
    }
    
    const errorMessage = 'An unexpected error occurred';
    // Return error response instead of throwing
    return { error: errorMessage };
  }
}

export const api = new ApiClient();

