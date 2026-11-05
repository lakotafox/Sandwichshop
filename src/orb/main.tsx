// Self-hosted type for the whole page (no font requests to third parties).
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/inter";

// Red sphere cradled in two hands: the gring-x hero scene from PUDDL3 P4RTS,
// recoloured from blue to red and mounted behind the page's opening section.
import { createRoot } from "react-dom/client";
import { NebulaSphere } from "./nebula-sphere";
import type { SceneConfigInput } from "./nebula-sphere.config";

const RED: SceneConfigInput = {
  glowColor: "#ff4a4a",
  centerDarken: 0.15,
  hands: { color: "#ffc4c4" },
  nebula: {
    colDeep: "#000000",
    colNebula: "#d10a1e",
    colBright: "#ff8a8a",
    colHot: "#ff2a1a",
    colStar: "#000000",
  },
};

const el = document.getElementById("orb");
const webgl = (() => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
})();

if (el && webgl) {
  const root = createRoot(el);
  root.render(<NebulaSphere config={RED} className="orb__canvas" />);
  window.addEventListener("intro:done", () => root.unmount(), { once: true });
}
