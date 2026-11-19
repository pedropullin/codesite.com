"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the scenes are never prerendered.
export const HeroGlyphs = dynamic(() => import("./HeroGlyphs"), { ssr: false });
export const RunKeys = dynamic(() => import("./RunKeys"), { ssr: false });
