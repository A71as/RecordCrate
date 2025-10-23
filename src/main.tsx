import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google login will be disabled.');
}

const root = createRoot(document.getElementById('root')!);

const appTree = (
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

if (googleClientId) {
  root.render(
    <GoogleOAuthProvider clientId={googleClientId}>
      {appTree}
    </GoogleOAuthProvider>
  );
} else {
  root.render(appTree);
}
