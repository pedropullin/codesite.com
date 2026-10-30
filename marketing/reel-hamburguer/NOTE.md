# NOTE: "Esse hambúrguer não é foto" (Reel, 12 s)

`final.mp4`: 1080x1920, 30 fps, 360 frames, no audio. Source: `index.html` (runtime from `.claude/skills/motionmaxxing/runtime`), plan in `STORYBOARD.md`.

## The idea, and why
A burger shown like a food photo turns, comes apart while the functions that draw each layer are typed, and then turns out to be inside a real website. The film belongs to CODE SITE because the code on screen is its own source (`concepts/brasa41/burger3d.js`) and the site is its own work (BRASA 41). A competitor would have to borrow both.

## Beats and what each buys
1. **Hook (0-2.2 s).** The viewer takes it for a product photo and reads "Esse hambúrguer não é foto."
2. **Turn and proof (2.2-6.1 s).** The burger whips a full turn, which a photo can't do. Then `makeTopBun()` ... `makeBottomBun()` are typed, and each layer lifts 2 frames after its call lands. The viewer sees it is built from code.
3. **Proof (6.1-9.0 s).** The dark ground turns out to be the BRASA 41 hero, and the camera pulls back to the whole phone with the burger still in its slot. "É um site." A thumb presses the page's own "Pedir agora" button. The viewer sees it is a real site for a business.
4. **CTA (9.0-12.0 s).** The press cuts to CODE SITE's paper ground: "Quer um site assim? Pede o seu.", the WhatsApp number, then the CODE SITE mark. The lockup keeps contracting to the last frame.

## What is real and what is not
- **Real:**
  - The 3D burger is the BRASA 41 code, rendered live by hero3d.
  - The function names are the real ones from that file.
  - The phone screen is a capture of `codesite.online/projetos/brasa41` at 390x844 @2x, with the page's own burger hidden so the live one takes its place.
  - The WhatsApp number and the CODE SITE mark come from `src/lib/site.ts` and `src/components/icons.tsx`.
- **Illustrative:**
  - The phone bezel is drawn in CSS.
  - The touch indicator stands in for a thumb.
  - The embers are seeded dots that mimic BRASA's hero canvas.
  - BRASA 41 is a fictional brand, and the page itself says so in its ribbon.
- **Not used:** no generated images, no voice, no music (no ElevenLabs key). Add an Instagram sound on top.

## Gates (numbers from the scripts, on the 12 s render)
- **G0 render exists: PASS.** 12.00 s against an expected 12.00 s; audio none (not planned).
- **G2 no empty frame: PASS.** No run of more than 3 flat frames.
- **G3 end hold and CTA share: PASS.**
  - End hold is 0.00 s: the film ends mid-motion, by design, because the lockup keeps contracting.
  - The final shot is 3.00 s, 25 % of the film.
- **G5 no page chrome: PASS** (`lint.mjs`).
  - C5 "mono micro-label" WARNs on the typed function names. They are the proof itself, at 0.040 H, and each is shown while its layer moves.
- **G1 proof readable (by eye, no script number):**
  - The code is 76 px (0.040 H).
  - The phone screen is 0.53 W at rest and fills the frame at the start of the dolly.
  - The BRASA hero type reads at both sizes.
  - The page's small ribbon text does not read at rest. It isn't the proof.
- **G4 one hero per frame (by eye):** the burger, then the phone with the burger in it, then the line and the number.
- **Motion:** look.py measured a mean frame-to-frame luma change of 2.9/255, below the human band of 4.4-9.8. The film is calm. Its living parts between beats are the slow turn, the push-in, the embers and the caret. The longest static-ish stretch is 0.80 s, during the held "photo" (0.9-1.7 s), and it is deliberate.

## Contact sheet, frame by frame
- 0.4 s: the burger at a product-shot angle on a warm coal ground, with "Esse hambúrguer" rising. One hero, not a slide.
- 1.1 s: both lines landed; the burger held like a photo.
- 1.9 s: the burger tilts toward the camera mid-turn while the type leaves upward.
- 2.6 s: the burger finishing its turn; the code line is about to start.
- 3.4 s: `makeLettuce()` typed; the top bun has lifted and the lettuce is rising.
- 4.1 s: `makeCheese()`; the burger is fanned four layers deep.
- 4.9 s: `makeBottomBun()`; the full unstack, the screenshot moment.
- 5.6 s: the layers falling back together.
- 6.3 s: the BRASA 41 page fills the frame around the burger (header, "SMASH NA CHAPA").
- 7.1 s: "É um site." over the whole phone; the burger is in the hero slot.
- 7.9 s: the slow push-in on the phone.
- 8.6 s: the thumb parks on "Pedir agora".
- 9.3 s: paper ground, "Quer um site" rising.
- 10.1 s: "Pede o seu." landing in blue.
- 10.9 s: the WhatsApp number landed, and the CODE SITE mark too.
- 11.6 s: the lockup still contracting.

## What I would still improve
- **Sound:** it is the biggest missing piece. Cut a beat on the whip turn (2.0 s), a click on each `()`, and silence before the dolly reveal (6.1 s).
- **CTA ground:** the paper ground is plain. A soft shadow of the phone carried across the cut would join the two worlds.
- **Cheese:** the cheese slices are the least convincing material in close-up.
