import { GoogleOAuthProvider } from '@react-oauth/google';

export const GoogleAuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId="952783879606-2q3f1p31kf43aq11vs5vbi5nf9dsoueo.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
};
