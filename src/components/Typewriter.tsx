"use client";

import { useEffect, useState } from "react";

/** Types each phrase, holds it, deletes it, moves on. Reduced motion shows the first phrase still. */
export default function Typewriter({ phrases, className = "" }: { phrases: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState(phrases[0]);
  const [deleting, setDeleting] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const word = phrases[i];
    let delay = deleting ? 38 : 70;
    if (!deleting && text === word) delay = 1800;
    if (deleting && text === "") delay = 260;
    const t = setTimeout(() => {
      if (!deleting && text === word) setDeleting(true);
      else if (deleting && text === "") {
        setDeleting(false);
        setI((i + 1) % phrases.length);
      } else setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, i, phrases]);

  return (
    <span className={className}>
      <span className="sr-only">{phrases.join(", ")}</span>
      <span aria-hidden>
        {text}
        <span className="type-caret" />
      </span>
    </span>
  );
}
