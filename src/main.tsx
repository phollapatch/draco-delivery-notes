import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle external browser extension or MetaMask exceptions gracefully
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || "";
    if (msg.includes("MetaMask") || msg.includes("metamask") || msg.includes("ethereum") || msg.includes("provider")) {
      console.warn("Gracefully suppressed external extension/MetaMask rejection:", event.reason);
      event.preventDefault(); // Prevent test suite or console-handling crashes from browser extensions
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.error?.message || event.message || "";
    if (msg.includes("MetaMask") || msg.includes("metamask") || msg.includes("ethereum") || msg.includes("provider")) {
      console.warn("Gracefully suppressed external extension/MetaMask runtime error:", event.error);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
