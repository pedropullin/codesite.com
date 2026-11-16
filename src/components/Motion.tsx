"use client";

import { useEffect } from "react";

/**
 * The page's motion layer: Lenis smooth scrolling driven by GSAP's ticker,
 * plus every scroll-linked and entrance animation on the homepage.
 * Everything is set up inside a reduced-motion check and only animates
 * *from* a state, so the page is complete and readable without it.
 */
export default function Motion() {
  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);

      const mm = gsap.matchMedia();
      let lenis: InstanceType<typeof Lenis> | null = null;

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ---------- smooth scroll ----------
        lenis = new Lenis({ lerp: 0.09, anchors: { offset: -80 } });
        (window as unknown as { __lenis?: unknown }).__lenis = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (t: number) => lenis?.raf(t * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        const expo = "expo.out";

        // ---------- hero: intro sequence ----------
        const title = document.querySelector<HTMLElement>("[data-hero-title]");
        if (title) {
          const split = SplitText.create(title, { type: "words", mask: "words" });
          // A split word loses its parent's clipped gradient, so it carries the gradient itself.
          split.words.forEach((w) => {
            if ((w as HTMLElement).closest(".text-aurora")) w.classList.add("text-aurora");
          });
          gsap.from(split.words, { yPercent: 110, duration: 1.2, ease: expo, stagger: 0.07, delay: 0.1 });
        }
        gsap.from("[data-hero-in]", { y: 36, autoAlpha: 0, duration: 1.1, ease: expo, stagger: 0.1, delay: 0.45 });
        gsap.from(".hero-section .aurora", { autoAlpha: 0, duration: 2.4, ease: "power2.out" });

        // ---------- hero: scrolling out ----------
        gsap
          .timeline({ scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true } })
          .to(".hero-content", { yPercent: -18, scale: 0.9, autoAlpha: 0, filter: "blur(8px)", ease: "none" }, 0)
          .to(".hero-section .aurora", { yPercent: 25, scale: 1.35, ease: "none" }, 0);

        // ---------- marquee leans with scroll speed ----------
        const skewTo = gsap.quickTo(".marquee-skew", "skewX", { duration: 0.5, ease: "power3" });
        ScrollTrigger.create({
          onUpdate: (self) => skewTo(gsap.utils.clamp(-14, 14, self.getVelocity() / -180)),
        });

        // ---------- section titles: lines rise out of a mask ----------
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          const chars = el.dataset.split === "chars";
          const split = SplitText.create(el, {
            type: chars ? "lines,chars" : "lines,words",
            mask: "lines",
          });
          gsap.from(chars ? split.chars : split.words, {
            yPercent: 115,
            rotate: chars ? 8 : 4,
            duration: chars ? 1 : 1.2,
            ease: expo,
            stagger: chars ? 0.025 : 0.06,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
          gsap.from(el, {
            y: 30,
            autoAlpha: 0,
            duration: 1.1,
            ease: expo,
            delay: 0.15,
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        // ---------- services: stacked sticky cards ----------
        const items = gsap.utils.toArray<HTMLElement>(".svc-item");
        items.forEach((item, i) => {
          const card = item.querySelector(".svc-card");
          const next = items[i + 1];
          gsap.from(card, {
            y: 80,
            autoAlpha: 0,
            duration: 1,
            ease: expo,
            scrollTrigger: { trigger: item, start: "top 92%" },
          });
          if (!next || !card) return;
          gsap.to(card, {
            scale: 0.9 + i * 0.012,
            filter: "brightness(0.5)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top 65%", end: "top 15%", scrub: true },
          });
        });

        // ---------- terminal: the window tips up into place ----------
        gsap.from(".term-window", {
          rotateX: 24,
          y: 120,
          scale: 0.92,
          transformOrigin: "50% 100%",
          ease: "none",
          scrollTrigger: { trigger: ".term-wrap", start: "top bottom", end: "top 35%", scrub: true },
        });

        // ---------- footer: the wordmark rises letter by letter ----------
        const mark = document.querySelector<HTMLElement>(".footer-mark");
        if (mark) {
          const split = SplitText.create(mark, { type: "chars", mask: "chars" });
          gsap.from(split.chars, {
            yPercent: 100,
            ease: "none",
            stagger: 0.06,
            scrollTrigger: { trigger: mark, start: "top bottom", end: "bottom bottom", scrub: true },
          });
        }

        // ---------- magnetic keys ----------
        const offs: Array<() => void> = [];
        if (window.matchMedia("(pointer: fine)").matches) {
          gsap.utils.toArray<HTMLElement>(".magnetic").forEach((btn) => {
            const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
            const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
            const move = (e: PointerEvent) => {
              const r = btn.getBoundingClientRect();
              xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
              yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
            };
            const leave = () => {
              xTo(0);
              yTo(0);
            };
            btn.addEventListener("pointermove", move);
            btn.addEventListener("pointerleave", leave);
            offs.push(() => {
              btn.removeEventListener("pointermove", move);
              btn.removeEventListener("pointerleave", leave);
            });
          });
        }

        return () => {
          offs.forEach((off) => off());
          gsap.ticker.remove(raf);
          lenis?.destroy();
          lenis = null;
        };
      });

      // ---------- large screens: pinned sequences ----------
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        // Projects scroll sideways while the row is pinned.
        const track = document.querySelector<HTMLElement>(".work-track");
        const pin = document.querySelector<HTMLElement>(".work-pin");
        if (track && pin) {
          const distance = () => track.scrollWidth - window.innerWidth;
          const slide = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: pin,
              start: "center center",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
          gsap.utils.toArray<HTMLElement>(".work-panel").forEach((panel) => {
            const img = panel.querySelector("img");
            gsap.fromTo(
              img,
              { scale: 1.25, xPercent: 6 },
              {
                scale: 1,
                xPercent: 0,
                ease: "none",
                scrollTrigger: { trigger: panel, containerAnimation: slide, start: "left right", end: "center center", scrub: true },
              }
            );
            gsap.from(panel.querySelectorAll("h3, p, a:not(.work-shot)"), {
              x: 120,
              autoAlpha: 0,
              stagger: 0.05,
              ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: slide, start: "left 85%", end: "left 35%", scrub: true },
            });
          });
        }

        // Process: pinned while the four steps light up in order.
        const steps = gsap.utils.toArray<HTMLElement>(".process-step");
        if (steps.length) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: ".process-pin", start: "top top", end: "+=1600", pin: true, scrub: 1 },
          });
          tl.to(".process-bar", { scaleX: 1, ease: "none", duration: steps.length }, 0);
          steps.forEach((step, i) => {
            tl.fromTo(
              step,
              { y: 90, autoAlpha: 0.15, scale: 0.94 },
              { y: 0, autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.8 },
              i
            );
            tl.fromTo(
              step.firstElementChild,
              { borderColor: "rgba(255,255,255,0.1)" },
              { borderColor: "rgba(111,151,255,0.7)", duration: 0.4, yoyo: true, repeat: 1 },
              i + 0.4
            );
          });
        }
      });

      // Phones and tablets: lighter entrances in place of the pins.
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".work-panel, .process-step").forEach((el) => {
          gsap.from(el, { y: 70, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
        });
      });

      // Fonts and lazy images change heights; re-measure once they settle.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      document.fonts?.ready.then(refresh);

      cleanup = () => {
        window.removeEventListener("load", refresh);
        mm.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
