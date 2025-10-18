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
        // You can modify headers here if needed
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

  private handleError(error: unknown, silent = false): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
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

