
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { NetworkProviderProvider } from "./contexts/NetworkProviderContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <NetworkProviderProvider>
    <App />
  </NetworkProviderProvider>
);
