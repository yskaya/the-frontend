# Error Handling System

## 🎯 **Architecture**

Centralized error handling with beautiful notification banners. Errors are caught at the API client level and transformed into user-friendly messages.

## 📊 **Error Flow**

```
API Call → Error → api.client.ts → handleApiError() → Notification Banner
```

1. **API call fails** (network, 4xx, 5xx)
2. **Axios intercepts** error in `api.client.ts`
3. **Error handler** transforms to user message
4. **Notification** displays banner with action button

## 🏗️ **Components**

### **1. API Client** (`api/api.client.ts`)

Axios wrapper with error interceptor:

```tsx
class ApiClient {
  setErrorHandler(handler: (error: AxiosError) => void) {
    this.errorHandler = handler;
  }

  private async handleError(error: AxiosError) {
    if (this.errorHandler) {
      this.errorHandler(error); // → Calls handleApiError()
    }
  }
}
```

### **2. Error Handler** (`features/errors/useErrorHandling.ts`)

Transforms API errors to notifications:

```tsx
export const useErrorHandling = () => {
  const { showNotification } = useNotification();

  const handleApiError = useCallback((error: AxiosError) => {
    const status = error.response?.status;
    
    // Map status code → user message
    switch (status) {
      case 401:
        showNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'You\'re not signed in.',
          action: { label: 'Login', onClick: () => window.location.href = '/login' }
        });
        break;
      // ... more cases
    }
  }, [showNotification]);

  return { handleApiError };
};
```

### **3. Notification System** (`components/Notification/`)

- **NotificationProvider** - Context for state management
- **NotificationStack** - Renders notification banners
- **NotificationItem** - Individual banner component
- **useNotification** - Hook to show notifications

## 🚨 **Error Types**

### **HTTP Status Errors**

| Status | Title | Message | Button |
|--------|-------|---------|--------|
| **400** | Invalid Request | The data you sent is invalid. | Try Again |
| **401** | Authentication Required | You're not signed in. | Login |
| **403** | Access Denied | You don't have permission. | Home |
| **404** | Not Found | This page doesn't exist. | Home |
| **408** | Request Timeout | The request took too long. | Try Again |
| **409** | Conflict | Data has changed. Refresh and retry. | Try Again |
| **429** | Rate Limit Exceeded | Too many requests. Wait and retry. | - |
| **500-504** | Server Error | Our servers encountered an issue. | Try Again |

### **Special Errors**

#### **Network Error**
```
Title: Connection Failed
Message: Unable to reach servers. Check your internet.
Button: Try Again
```

#### **Session Expired**
```
Title: Session Expired
Message: Your session has expired. Sign in again.
Button: Login
```

#### **Unknown Error**
```
Title: Error
Message: Something unexpected happened.
Button: Try Again
```

## 🎨 **Message Pattern**

Every error follows: **Bold Title**. Technical issue. What to do.

```
[Icon] **Title**. Sentence 1. Sentence 2. [Button] [×]
```

**Examples:**

```
[🔴] **Authentication Required**. You're not signed in.
     Please log in to access this feature. [Login] [×]

[⚠️] **Server Error**. Our servers encountered an issue.
     Please try again in a moment. [Try Again] [×]
```

## 📋 **Button Actions**

| Button | Action | Used For |
|--------|--------|----------|
| **Try Again** | `window.location.reload()` | 400, 408, 409, 500-504, Network |
| **Login** | `window.location.href = '/login'` | 401, Session Expired |
| **Home** | `window.location.href = '/'` | 403, 404 |

## 🔧 **Usage Patterns**

### **Pattern 1: With Notifications (Default)**

For user-initiated actions (login, create, update, delete):

```tsx
// In feature.api.ts
export const loginGoogle = async (code: string) => {
  const response = await api.post('/auth/login/google', { code });
  return response.data || null;
};

// Errors automatically show notifications!
```

### **Pattern 2: Silent (No Notifications)**

For background checks (session validation, polling):

```tsx
// In feature.api.ts
export const validate = async () => {
  try {
    const response = await api.client.get('/users/me', { silent: true });
    return response.data;
  } catch {
    return null; // Silent failure - no notification
  }
};
```

### **Pattern 3: Custom Error Handling**

When you need custom messages:

```tsx
try {
  const response = await api.post('/upload', formData);
  return response.data;
} catch (error) {
  if (error.response?.status === 413) {
    showNotification({
      type: 'error',
      title: 'File Too Large',
      message: 'Maximum file size is 10MB.'
    });
  }
  return null;
}
```

## 🎯 **Decision Matrix**

| API Call Type | User Initiated? | Show Error? | Pattern |
|---------------|----------------|-------------|---------|
| Login | Yes | Yes | With notifications |
| Logout | Yes | Yes | With notifications |
| Create/Update | Yes | Yes | With notifications |
| Delete | Yes | Yes | With notifications |
| Validate session | No | No | Silent |
| Background poll | No | No | Silent |
| Prefetch | No | No | Silent |

## ⚙️ **Setup** (Already Done)

In `_app.tsx`:

```tsx
function ApiErrorSetup({ children }) {
  const { handleApiError } = useErrorHandling();
  
  useEffect(() => {
    api.setErrorHandler(handleApiError);
  }, [handleApiError]);
  
  return <>{children}</>;
}

export default function App({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <ApiErrorSetup>
        <Component {...pageProps} />
        <NotificationStack />
      </ApiErrorSetup>
    </NotificationProvider>
  );
}
```

## 🎨 **Styling**

Notification banners use **Adobe Spectrum** design:
- Light backgrounds with subtle borders
- Horizontal layout (icon, text, button)
- Solid white action buttons (16px radius)
- Auto-dismiss after 5 seconds
- Backdrop blur effect
- Smooth animations

## ✅ **Testing**

Visit `/test-errors` page to test all error types.

## 🔄 **Integration with React Query**

React Query mutations inherit the error handler:

```tsx
export const useLogin = () => {
  return useMutation({
    mutationFn: loginGoogle,
    // Errors automatically handled by api.client.ts!
  });
};
```

**No additional error handling needed!** The API client catches all errors and shows notifications automatically.

