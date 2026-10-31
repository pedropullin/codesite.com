# NOTE: "Do código ao ar" (Reel 1 of the 3D series, 12 s)

`final.mp4`: 1080x1920, 30 fps, 360 frames, no audio. Source: `index.html`; plan in `STORYBOARD.md` and in the deck "Roteiros 3D CODE SITE", Reel 1.

## Idea
The CODE SITE mark is assembled in 3D by the four steps of its own process (`git init`, `design --figma`, `npm run build`, `deploy --prod`, from the Processo section of codesite.online). The last step flips the mark into a phone showing the live homepage, and a thumb presses its "Vamos criar" button, which cuts to the WhatsApp CTA.

## Real and illustrative
- **Real:**
  - The mark's geometry is taken from `src/components/icons.tsx` (the same strokes, made solid).
  - The commands are the site's own.
  - The phone screen is a capture of the local production build of codesite.online at 390x844 @2x.
  - The number comes from `src/lib/site.ts`.
- **Illustrative:** the phone body and the thumb.
- **Not used:** no generated images, no sound.

## Gates (scripts, final render)
- **G0: PASS.** 12.00 s.
- **G2: PASS.**
- **G3: PASS.** End hold 0.27 s, ending mid-motion. Final shot 3.00 s, 25 %.
  - The first render failed G3 with a 1.47 s hold. The CTA contraction is now linear to the last frame.
  - The same render also had a 0.6 s frozen stretch at 2.2 s. The mark's turn is now linear, so it never stops.
- **G5: PASS** (`lint.mjs`). C5 WARNs on the typed commands, which are the content.
- **G1 (by eye):** the commands are at 76 px (0.040 H) and the phone fills 0.45 W at rest. The hero copy "CÓDIGO QUE VIRA EXPERIÊNCIA." reads, and the small body text does not (it is not the proof).
- **G4 (by eye):** one hero per frame: the chevrons, then the mark, then the phone, then the number.
- **Motion:** 1.6/255, a calm film. The living parts are the drift, the slow turn, the sweep on the lacquer, the push-in and the caret.

## Frame by frame (contact sheet)
- The chevrons drift in space under "Todo site começa assim."
- `git init`: they snap together.
- `design --figma`: the lacquer tile rises, and a softbox sweeps across it.
- `npm run build`: the blue slash lands.
- `deploy --prod`: the mark turns edge-on and lands as the phone.
- "No ar.": the camera pushes in, and the thumb parks on "Vamos criar".
- Paper CTA: "Quer o seu no ar?", the number, the mark.

## Would still improve
- Sound: a click per command and a hit when the slash lands.
- A real bevel highlight on the chevrons.
