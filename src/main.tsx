import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { purgeMockDataFromStorage } from './lib/cleanupMockData';

// Ensure any old hardcoded mock data is purged so only database data is loaded
purgeMockDataFromStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

