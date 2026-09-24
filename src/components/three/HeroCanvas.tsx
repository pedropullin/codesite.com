"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the scene is never prerendered.
const CodeScene = dynamic(() => import("./CodeScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
        carregando cena 3D<span className="caret">_</span>
      </span>
    </div>
  ),
});

export default function HeroCanvas() {
  return <CodeScene />;
}
