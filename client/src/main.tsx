import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent Vite HMR from triggering full page reloads on connection loss
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('[HMR] Full reload prevented - connection restored');
    throw new Error('Preventing full reload');
  });
}

createRoot(document.getElementById("root")!).render(<App />);
