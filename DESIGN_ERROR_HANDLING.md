# 🚨 Architecture: Error Handling System

**How errors are caught, displayed, and managed**

---

## 📊 Error Handling Layers

### 1. Error Boundaries (React)
```tsx
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

Catches:
- JavaScript errors
- React component errors
- Rendering errors

### 2. API Client Interceptors (Axios)
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    handleApiError(error);
    return Promise.reject(error);
  }
);
```

Catches:
- Network errors
- HTTP errors (4xx, 5xx)
- Timeout errors

### 3. React Query Error Handling
```typescript
onError: (error) => {
  showNotification({
    type: 'error',
    message: getErrorMessage(error)
  });
}
```

Catches:
- API call failures
- Mutation errors
- Query errors

---

## 🎨 Notification System

### 4 Types:
- ❌ Error (red, 6s auto-dismiss)
- ⚠️ Warning (yellow, 4s auto-dismiss)
- ℹ️ Info (blue, 3s auto-dismiss)
- ✅ Success (green, 2s auto-dismiss)

### HTTP Status Mapping:
- 400-499 → Warning notification
- 500-504 → Error notification
- Network → Error notification

---

## ✅ Current Implementation (Grade: B+ 85/100)

**Strengths:**
- Comprehensive HTTP status coverage
- 4 notification types
- Error suppression for Axios errors
- Test page at /error-test

**Missing:**
- Request ID tracking
- Error rate limiting
- Sentry integration
- Retry logic

---

**See:** `BACKLOG_FRONTEND.md` for improvements needed

