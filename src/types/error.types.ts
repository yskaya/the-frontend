export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  requestId?: string;
}
