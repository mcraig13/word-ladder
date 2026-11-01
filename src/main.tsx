// App entry point: mounts App into the #app root in index.html, with the
// bundled game data and the player's date. Excluded from coverage; the
// browser test runs it (D33).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getBundledGameData } from "./puzzles/getBundledGameData";
import { launchDate } from "./puzzles/launchDate";
import { App } from "./ui/App";
import { getLocalCalendarDate } from "./ui/getLocalCalendarDate";

const root = document.getElementById("app");
if (root === null) {
  throw new Error("index.html has no #app element to mount the game into.");
}

createRoot(root).render(
  <StrictMode>
    <App
      gameDataResult={getBundledGameData()}
      today={getLocalCalendarDate(new Date())}
      launchDate={launchDate}
    />
  </StrictMode>,
);
