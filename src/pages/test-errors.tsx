import { useErrorHandling } from '@/features/errors';
import { api } from '@/api/api.client';

export default function TestErrorsPage() {
  const { handleApiError, handleNetworkError, handleAuthError, handleValidationError } = useErrorHandling();

  // Simulate different HTTP status codes
  const testStatusCode = (status: number) => {
    const error = {
      response: {
        status,
        data: { message: `Test ${status} error` },
        config: { url: '/test', method: 'get' },
      },
      isAxiosError: true,
      name: 'AxiosError',
    };
    handleApiError(error);
  };

  // Test actual API call failure
  const testRealApiError = async () => {
    try {
      await api.get('/non-existent-endpoint');
    } catch (error) {
      // Error will be handled by API client automatically
    }
  };

  // Test internal JavaScript error
  const testInternalError = () => {
    throw new Error('Test internal JavaScript error');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Error Testing Page
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Test all notification types and error handling
        </p>

        {/* HTTP Status Code Errors */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            HTTP Status Code Errors
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <button
              onClick={() => testStatusCode(400)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              400 Bad Request
            </button>
            <button
              onClick={() => testStatusCode(401)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              401 Unauthorized
            </button>
            <button
              onClick={() => testStatusCode(403)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              403 Forbidden
            </button>
            <button
              onClick={() => testStatusCode(404)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              404 Not Found
            </button>
            <button
              onClick={() => testStatusCode(408)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              408 Timeout
            </button>
            <button
              onClick={() => testStatusCode(409)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              409 Conflict
            </button>
            <button
              onClick={() => testStatusCode(429)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              429 Rate Limit
            </button>
            <button
              onClick={() => testStatusCode(500)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              500 Server Error
            </button>
            <button
              onClick={() => testStatusCode(502)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              502 Bad Gateway
            </button>
            <button
              onClick={() => testStatusCode(503)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              503 Unavailable
            </button>
            <button
              onClick={() => testStatusCode(504)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              504 Timeout
            </button>
          </div>
        </section>

        {/* Special Error Handlers */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Special Error Types
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={handleNetworkError}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium text-white"
            >
              Network Error
            </button>
            <button
              onClick={handleAuthError}
              className="px-4 py-3 bg-orange-600 hover:bg-orange-700 transition-colors text-sm font-medium text-white"
            >
              Auth Error
            </button>
            <button
              onClick={() => handleValidationError('Test validation error')}
              className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 transition-colors text-sm font-medium text-white"
            >
              Validation Error
            </button>
          </div>
        </section>

        {/* Real API Errors */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Real API Errors
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={testRealApiError}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 transition-colors text-sm font-medium text-white"
            >
              404 Real API Call
            </button>
            <button
              onClick={() => {
                // Intentionally trigger error boundary
                testInternalError();
              }}
              className="px-4 py-3 bg-pink-600 hover:bg-pink-700 transition-colors text-sm font-medium text-white"
            >
              Internal JS Error
            </button>
          </div>
        </section>

        {/* Info */}
        <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            Testing Instructions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>HTTP Status Codes</strong> - Simulated errors with different status codes</li>
            <li>• <strong>Special Errors</strong> - Network, Auth, and Validation handlers</li>
            <li>• <strong>Real API</strong> - Actual API calls that fail</li>
            <li>• <strong>Internal Error</strong> - Triggers ErrorBoundary</li>
            <li>• Watch notifications appear at the top-center of the page</li>
            <li>• Check console for technical error details</li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="mt-8">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

