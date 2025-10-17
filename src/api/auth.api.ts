import { api } from './api.client';

export const loginGoogle = async (code: string) => {
  const response = await api.post('/auth/login/google', { code });
  
  if (response.error) {
    return null;
  }
  
  if (!response.data) {
    return null;
  }
  
  return response.data as { user: { id: string; email: string; firstName: string; lastName: string }; tokens: []};
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  // Return response so caller can check if logout succeeded
  return response;
};

export const validate = async () => {
  try {
    // Use raw axios client to bypass global error notifications for validation
    const response = await api.client.get('/users/me');
    return response.data;
  } catch {
    // Validation failure is expected when not logged in - fail silently
    return null;
  }
};

 