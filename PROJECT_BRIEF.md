# Cinematic Website Project Brief

## Project

- Project name: `STRIA Carbon Rod`
- Subject, destination, or brand: `STRIA — precision carbon fibre seatpost`
- Audience: `Performance cyclists, bike-fit specialists, and product design enthusiasts`
- Existing repository or project path: `/agent` (greenfield)
- Existing stack: `Vanilla HTML / CSS / JavaScript`
- Required launch or delivery date: `Immediate`

## Goal

Primary message:

`A carbon fibre seatpost that reads as engineered material, not anonymous tubing — weave, clamp, and structure revealed through a continuous camera move.`

Desired user response:

`Feel the product’s precision, then explore specs and request fit guidance.`

Final interaction or CTA:

`Horizontal catalog of engineering specs + “Request fit guide” primary action`

## Visual direction

- Overall style: `High-key studio product editorial; one continuous white-world stage; photographic product layers with restrained type`
- Mood: `Calm, technical, premium, tactile`
- Time of day and lighting: `Soft top-left studio light matching the source photography`
- Camera and lens character: `Slow push-in from bike context → isolated rod → exploded assembly → catalog`
- Color palette: `Cool studio paper #E8ECF0, ink #121417, carbon charcoal #2B3036, silver #A7ADB4, signal red #D61F2C`
- Display typeface: `Fraunces`
- Interface typeface: `IBM Plex Sans`
- Styles to avoid: `Purple gradients, cream/terracotta editorial clichés, glassmorphism, neon glow, dark-mode default, pill clusters, stat strips`

## Narrative beats

### Beat 1 — Hero

- Headline: `Carbon, held.`
- Supporting copy: `STRIA is a 3K weave seatpost built for stiffness where you need it and compliance where you sit.`
- Visible visual layers: `Studio plate + in-situ bike context (seatpost + saddle)`
- Intended motion: `Hero hold, then slow push toward the carbon shaft as intro copy exits`

### Beat 2 — First narrative

- Headline: `Clamp geometry`
- Supporting copy: `Two-bolt rail cradle, machined head, and a side adjuster that keeps saddle angle honest under load.`
- Facts or CTA: `CNC aluminum head · Hex hardware · Stable rail bite`
- Intended transition: `Context softens and exits; isolated rod enters with a framed focus window`

### Beat 3 — World reveal

- Purpose: `Show the exploded engineering assembly as the “clean panorama”`
- Intended transition: `Foreground focus clears into the floating exploded view`

### Beat 4 — Second narrative

- Headline: `3K weave, clear coat`
- Supporting copy: `The checkerboard carbon is structural language — light, aligned fibers under a satin resin skin.`
- Facts or CTA: `Hollow tube · End plug sealed · Weave continuity`
- Intended transition: `Exploded holds while narrative B enters; then world refocuses on the assembled rod`

### Beat 5 — Final catalog

- Catalog purpose: `Spec and feature cards for the seatpost system`
- Card content: `Hardcoded product facts (mass target, diameter, clamp, weave, finish, fit CTA)`
- Card action: `Informational cards; final CTA button scrolls to contact marker / opens mailto`
- Final CTA: `Request fit guide`

## Assets

- Asset directory: `public/assets`
- Asset manifest: `assets.json`
- Reference screencast: `None`
- Reference screenshots: `Source product stills in /agent/assets`
- Brand assets: `Derived from product photography; brand mark is typographic STRIA`
- Fonts: `Google Fonts — Fraunces + IBM Plex Sans`

## Responsive requirements

- Desktop priority: `1440×900 cinematic sticky stage`
- Mobile priority: `Preserve rod as subject; reduce parallax; shorten scroll travel`
- Mobile crop or composition notes: `Bias object-position toward vertical shaft center; keep brand readable over calm white field`
- Required browsers: `Latest Chrome, Safari, Firefox, Edge`
- Minimum device expectations: `Modern phone and laptop; reduced-motion path required`

## Accessibility

- Reduced-motion preference: `Disable parallax/smoothing; present static hero then normal-flow narrative + catalog`
- Keyboard requirements: `Nav jumps, catalog prev/next, focus-visible controls`
- Image-description requirements: `Meaningful alts on product images; empty alt on pure atmosphere`
- Localization requirements: `English only`

## Performance

- Target initial transfer size: `< 600KB critical path`
- Target total image transfer size: `< 1.2MB`
- Required analytics or monitoring: `None`

## Constraints

- Dependencies that may be used: `None required; static hosting only`
- Dependencies that must not be added: `GSAP, Lenis, Three.js, React, frameworks`
- Existing components that must be preserved: `N/A — greenfield`
- Out-of-scope items: `E-commerce checkout, CMS, WebGL material shader`

## Acceptance criteria

- `Sticky cinematic stage with reversible scroll timeline`
- `All narrative beats have enter / hold / exit`
- `Final catalog is keyboard + swipe usable`
- `Reduced-motion path keeps all content`

## Notes

Source assets are complete studio stills on white, not pre-cut depth layers. Implementation uses photographic plates as mid/hero/exploded roles plus CSS atmosphere layers. Transparent cutout recomposites remain a production follow-up.
