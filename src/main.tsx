import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';



const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
