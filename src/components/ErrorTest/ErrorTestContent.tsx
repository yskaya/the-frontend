import React, { useState } from 'react';
import { api } from '@/api/api.client';
import { useNotification } from '@/components/Notification/useNotification';

export const ErrorTestContent = () => {
  const [componentError, setComponentError] = useState(false);
  const [undefinedMapError, setUndefinedMapError] = useState(false);
  const { showError, showWarning, showInfo, showSuccess } = useNotification();

  // Trigger a React component error (will be caught by ErrorBoundary)
  if (componentError) {
    throw new Error('Intentional React component error for testing ErrorBoundary!');
  }

  // Trigger undefined.map error (will be caught by ErrorBoundary)
  if (undefinedMapError) {
    const obj: any = undefined;
    obj.map((x: any) => x); // This will throw during render
  }

  // Simulate API errors with different status codes
  const testApiError = (statusCode: number) => {
    console.log('🔵 Testing API error:', statusCode);
    
    // Create a mock axios error with the specified status code
    const mockError = {
      isAxiosError: true,
      name: 'AxiosError',
      message: `Request failed with status code ${statusCode}`,
      response: {
        status: statusCode,
        data: {
          error: getErrorTitle(statusCode),
          message: getErrorMessage(statusCode),
          statusCode: statusCode,
          timestamp: new Date().toISOString(),
          path: `/test/error/${statusCode}`
        },
        config: {
          url: `/test/error/${statusCode}`,
          method: 'POST'
        }
      }
    };

    // Trigger the error handler directly
    const apiClient = api as any;
    if (apiClient.errorHandler) {
      console.log('✓ Error handler found, triggering...');
      apiClient.errorHandler(mockError);
    } else {
      console.error('✗ Error handler not found on API client');
      // Fallback: show notification directly
      showError(
        getErrorMessage(statusCode),
        getErrorTitle(statusCode)
      );
    }
  };

  const getErrorTitle = (statusCode: number): string => {
    const titles: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      408: 'Request Timeout',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };
    return titles[statusCode] || 'Error';
  };

  const getErrorMessage = (statusCode: number): string => {
    const messages: { [key: number]: string } = {
      400: 'The request was invalid',
      401: 'Authentication is required',
      403: 'You do not have permission',
      404: 'The requested resource was not found',
      408: 'The request took too long',
      409: 'There was a conflict with the current state',
      429: 'Too many requests',
      500: 'Internal server error occurred',
      502: 'Bad gateway',
      503: 'Service is temporarily unavailable',
      504: 'Gateway timeout'
    };
    return messages[statusCode] || 'An error occurred';
  };

  // Test network error (backend not responding)
  const testNetworkError = () => {
    // Create a mock network error
    const mockNetworkError = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Network Error',
      code: 'ERR_NETWORK',
      request: {}
    };

    // Trigger the error handler directly
    const apiClient = api as any;
    if (apiClient.errorHandler) {
      apiClient.errorHandler(mockNetworkError);
    }
  };

  // Test timeout error
  const testTimeoutError = () => {
    // Create a mock timeout error
    const mockTimeoutError = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'timeout of 10000ms exceeded',
      code: 'ECONNABORTED',
      response: {
        status: 408,
        data: {
          error: 'Request Timeout',
          message: 'The request took too long to complete',
          statusCode: 408
        },
        config: {
          url: '/slow-endpoint',
          method: 'GET'
        }
      }
    };

    // Trigger the error handler directly
    const apiClient = api as any;
    if (apiClient.errorHandler) {
      apiClient.errorHandler(mockTimeoutError);
    }
  };

  // Test unhandled promise rejection (will be caught by global handler)
  const testUnhandledRejection = () => {
    console.log('🔵 Creating unhandled promise rejection...');
    // This will be caught by the global unhandledrejection handler in _app.tsx
    setTimeout(() => {
      Promise.reject(new Error('⚠️ Unhandled promise rejection test'));
    }, 100);
    showInfo('Check console for unhandled rejection log', 'Promise Test');
  };

  // Test async error without await (will be caught by global handler)
  const testAsyncError = () => {
    console.log('🔵 Creating async error without await...');
    const asyncFunction = async () => {
      throw new Error('⚠️ Async error without await test');
    };
    
    // Call without await - creates unhandled rejection
    setTimeout(() => {
      asyncFunction(); // No catch - will trigger global handler
    }, 100);
    showInfo('Check console for async error log', 'Async Test');
  };

  // Test properly caught async error (shows how it should be done)
  const testProperAsyncError = async () => {
    try {
      throw new Error('This is a properly caught async error');
    } catch (err: any) {
      console.log('✅ Async error properly caught:', err.message);
      showSuccess('Async error was properly caught and handled!', 'Proper Async');
    }
  };

  // Test manual notifications
  const testNotifications = (type: string) => {
    switch (type) {
      case 'error':
        showError('This is a test error notification', 'Error Test');
        break;
      case 'warning':
        showWarning('This is a test warning notification', 'Warning Test');
        break;
      case 'info':
        showInfo('This is a test info notification', 'Info Test');
        break;
      case 'success':
        showSuccess('This is a test success notification', 'Success Test');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Error Boundary Test Page</h1>
        <p className="text-gray-600 mb-8">Test different error scenarios and see how they&apos;re handled</p>

        {/* API Errors Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🌐 API Errors (HTTP Status Codes)</h2>
          <p className="text-sm text-gray-600 mb-4">These should show notification popups, NOT black screen</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => testApiError(400)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm"
            >
              400 Bad Request
            </button>
            <button
              onClick={() => testApiError(401)}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-sm"
            >
              401 Unauthorized
            </button>
            <button
              onClick={() => testApiError(403)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              403 Forbidden
            </button>
            <button
              onClick={() => testApiError(404)}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm"
            >
              404 Not Found
            </button>
            <button
              onClick={() => testApiError(408)}
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 text-sm"
            >
              408 Timeout
            </button>
            <button
              onClick={() => testApiError(409)}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 text-sm"
            >
              409 Conflict
            </button>
            <button
              onClick={() => testApiError(429)}
              className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 text-sm"
            >
              429 Rate Limit
            </button>
            <button
              onClick={() => testApiError(500)}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 text-sm"
            >
              500 Server Error
            </button>
            <button
              onClick={() => testApiError(502)}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 text-sm"
            >
              502 Bad Gateway
            </button>
            <button
              onClick={() => testApiError(503)}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 text-sm"
            >
              503 Unavailable
            </button>
            <button
              onClick={() => testApiError(504)}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 text-sm"
            >
              504 Gateway Timeout
            </button>
          </div>
        </div>

        {/* Network Errors Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📡 Network Errors</h2>
          <p className="text-sm text-gray-600 mb-4">These should show notification popups, NOT black screen</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={testNetworkError}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Network Error (Backend Down)
            </button>
            <button
              onClick={testTimeoutError}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Timeout Error
            </button>
          </div>
        </div>

        {/* React Component Errors Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚛️ React Component Errors</h2>
          <p className="text-sm text-gray-600 mb-4">
            These should show black screen ONLY in development (ErrorBoundary)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setComponentError(true)}
              className="bg-red-900 text-white px-4 py-2 rounded hover:bg-red-950"
            >
              Trigger React Error
            </button>
            <button
              onClick={() => setUndefinedMapError(true)}
              className="bg-red-900 text-white px-4 py-2 rounded hover:bg-red-950"
            >
              Undefined.map() Error
            </button>
          </div>
        </div>

        {/* Promise/Async Errors Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔄 Promise & Async Errors</h2>
          <p className="text-sm text-gray-600 mb-4">Test different async error scenarios</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={testUnhandledRejection}
              className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 text-sm"
            >
              Unhandled Rejection
            </button>
            <button
              onClick={testAsyncError}
              className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 text-sm"
            >
              Async Error (No Await)
            </button>
            <button
              onClick={testProperAsyncError}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 text-sm"
            >
              Properly Caught Async
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p><strong>Note:</strong> Unhandled errors are logged to console by global handler. Check browser console after clicking.</p>
          </div>
        </div>

        {/* Notification Types Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔔 Test Notification Types</h2>
          <p className="text-sm text-gray-600 mb-4">Test different notification styles</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => testNotifications('error')}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Error
            </button>
            <button
              onClick={() => testNotifications('warning')}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Warning
            </button>
            <button
              onClick={() => testNotifications('info')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Info
            </button>
            <button
              onClick={() => testNotifications('success')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Success
            </button>
          </div>
        </div>

        {/* Console Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>💡 Tip:</strong> Open your browser console (F12) to see detailed error logs while testing.
          </p>
        </div>

        {/* Expected Behavior */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">✅ Expected Behavior</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>API Errors (400-500s):</strong> Show notification popup with friendly message, no black screen
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>Network Errors:</strong> Show &quot;Connection Problem&quot; notification, no black screen
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-yellow-500 mr-2">⚠</span>
              <div>
                <strong>React Component Errors:</strong> Black screen in development, logged in production
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <div>
                <strong>All Errors:</strong> Technical details logged to console for debugging
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
