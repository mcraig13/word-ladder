// App entry point: mounts App into the #app root in index.html. Excluded from
// coverage; the browser test runs it (D33).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";

const root = document.getElementById("app");
if (root === null) {
  throw new Error("index.html has no #app element to mount the game into.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
