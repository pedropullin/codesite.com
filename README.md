# CODE SITE — Estúdio Digital

Site do [codesite.online](https://codesite.online): Next.js 16, Tailwind v4 e uma cena 3D interativa em
React Three Fiber.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção
```

## Onde mudar as coisas

- **Links e contato** (WhatsApp, Instagram, TikTok, Discord, e-mail, LinkedIn): `src/lib/site.ts`
- **Projetos do portfólio**: `src/lib/projects.ts`
- **Cores** (mesma paleta do site original): variáveis no topo de `src/app/globals.css`
- **Cena 3D do topo**: `src/components/three/CodeScene.tsx`

## Fonte 3D

Os símbolos e as teclas 3D usam a IBM Plex Mono convertida para o formato do three.js em
`public/fonts/plex-mono-bold.typeface.json`. Para gerar de novo (por exemplo, depois de incluir novos
caracteres em `scripts/make-typeface.mjs`):

```bash
npm run fonts:3d
```
