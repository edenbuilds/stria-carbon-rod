# STRIA — Carbon Fibre Seatpost

Cinematic scroll microsite for a carbon fibre seatpost, built from the [cinematic-scroll-prompt-kit](https://github.com/amirmushichge/cinematic-scroll-prompt-kit) contract.

## Run locally

```bash
npm start
```

Then open the printed localhost URL (defaults to `http://127.0.0.1:4173`).

Or serve the project root with any static server:

```bash
npx --yes serve -l 4173 .
```

## Project inputs

| File | Role |
| --- | --- |
| `PROJECT_BRIEF.md` | Product / narrative brief |
| `assets.json` | Layer manifest |
| `cinematic-build-brief/PROMPT.txt` | Kit implementation contract |
| `public/assets/` | Product photography |

## Timeline map

| Progress | Beat |
| --- | --- |
| `0.00–0.03` | Hero hold — bike context + STRIA lockup |
| `0.03–0.18` | Intro exits |
| `0.12–0.26` | Push-in toward the carbon shaft |
| `0.24–0.36` | Narrative A — clamp geometry |
| `0.38–0.50` | Exploded engineering reveal |
| `0.48–0.62` | Narrative B — 3K weave |
| `0.70–0.78` | World refocus on assembled rod |
| `0.74–0.96` | Spec catalog enters |
| `0.91–1.00` | Catalog controls settle |

## Notes

- Source assets are studio stills on white, not pre-cut transparent depth layers. Atmosphere / frame / tint roles are CSS.
- No GSAP / Lenis / Three.js — native scroll + `requestAnimationFrame` + CSS custom properties.
- `prefers-reduced-motion` disables parallax/smoothing and presents a readable stacked flow.
