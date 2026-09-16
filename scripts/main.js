const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const rangeProgress = (p, start, end) => {
  if (end <= start) return p >= end ? 1 : 0;
  return clamp((p - start) / (end - start), 0, 1);
};
const segmentInOut = (p, enterStart, enterEnd, exitStart, exitEnd) => {
  const enter = smoothstep(rangeProgress(p, enterStart, enterEnd));
  const exit = 1 - smoothstep(rangeProgress(p, exitStart, exitEnd));
  return Math.min(enter, exit);
};

const SCENES = {
  heroHold: [0.0, 0.03],
  introExit: [0.03, 0.18],
  pushIn: [0.12, 0.26],
  narrativeA: [0.24, 0.36],
  narrativeAExit: [0.36, 0.44],
  panorama: [0.42, 0.5],
  narrativeB: [0.48, 0.62],
  narrativeBExit: [0.62, 0.72],
  refocus: [0.7, 0.78],
  catalog: [0.74, 0.96],
  settle: [0.91, 1.0],
};

const state = {
  targetP: 0,
  visualP: 0,
  ptrTargetX: 0,
  ptrTargetY: 0,
  ptrX: 0,
  ptrY: 0,
  raf: 0,
  needsFrame: false,
  geometry: { top: 0, travel: 4200, stageH: 0 },
  reducedMotion: false,
  coarsePointer: false,
  ready: false,
};

const els = {
  section: document.querySelector("[data-cinematic]"),
  stage: document.querySelector("[data-stage]"),
  world: document.querySelector("[data-world]"),
  loader: document.querySelector("[data-loader]"),
  catalog: document.querySelector("[data-catalog]"),
  track: document.querySelector("[data-catalog-track]"),
  status: document.querySelector("[data-catalog-status]"),
  prev: document.querySelector("[data-catalog-prev]"),
  next: document.querySelector("[data-catalog-next]"),
  reducedFlow: document.querySelector("[data-reduced-flow]"),
  root: document.documentElement,
};

function measure() {
  if (!els.section || !els.stage) return;
  const rect = els.section.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const top = rect.top + scrollY;
  const stageH = els.stage.clientHeight || window.innerHeight;
  const travelAttr = Number(els.section.dataset.scrollTravel || 4200);
  const travel = Math.max(els.section.offsetHeight - stageH, travelAttr * (window.innerWidth < 720 ? 0.76 : 1));
  state.geometry = { top, travel, stageH };
}

function localProgress() {
  const { top, travel } = state.geometry;
  const y = (window.scrollY || window.pageYOffset) - top;
  return travel > 0 ? clamp(y / travel, 0, 1) : 0;
}

function computeScene(p) {
  const introExit = smoothstep(rangeProgress(p, ...SCENES.introExit));
  const push = smoothstep(rangeProgress(p, ...SCENES.pushIn));
  const na = segmentInOut(p, 0.24, 0.28, 0.35, 0.42);
  const nb = segmentInOut(p, 0.48, 0.54, 0.64, 0.72);
  const explodedEnter = smoothstep(rangeProgress(p, 0.38, 0.48));
  const explodedExit = smoothstep(rangeProgress(p, 0.7, 0.78));
  const heroEnter = smoothstep(rangeProgress(p, 0.16, 0.28));
  const heroMidExit = smoothstep(rangeProgress(p, 0.38, 0.46));
  const heroReturn = smoothstep(rangeProgress(p, 0.7, 0.8));
  const catalogEnter = smoothstep(rangeProgress(p, ...SCENES.catalog));
  const settle = smoothstep(rangeProgress(p, ...SCENES.settle));

  const contextO = clamp(1 - push * 1.05, 0, 1) * (1 - explodedEnter * 0.85);
  const heroO = clamp(heroEnter * (1 - heroMidExit) + heroReturn * 0.95, 0, 1);
  const explodedO = clamp(explodedEnter * (1 - explodedExit), 0, 1);

  const worldScale = lerp(1, 1.18, push) * lerp(1, 0.98, catalogEnter);
  const worldBlur = state.reducedMotion ? 0 : lerp(0, 4, Math.max(na * 0.6, nb * 0.55));
  const tintO = Math.max(na, nb) * 0.55 + catalogEnter * 0.15;
  const frameO = clamp(push * 0.85 - explodedEnter * 0.9 + na * 0.35, 0, 0.9);
  const frameInset = `${lerp(0, 12, push - na * 0.4)}%`;

  return {
    "--p": p.toFixed(4),
    "--world-scale": worldScale.toFixed(4),
    "--world-x": `${(state.ptrX * -8).toFixed(2)}px`,
    "--world-y": `${(state.ptrY * -6).toFixed(2)}px`,
    "--world-blur": `${worldBlur.toFixed(2)}px`,
    "--context-o": contextO.toFixed(4),
    "--context-scale": (1 + push * 0.22).toFixed(4),
    "--context-x": `${lerp(0, -40, push).toFixed(2)}px`,
    "--context-y": `${lerp(0, -24, push).toFixed(2)}px`,
    "--hero-o": heroO.toFixed(4),
    "--hero-scale": (lerp(1.1, 1, heroEnter) * lerp(1, 0.94, catalogEnter)).toFixed(4),
    "--hero-x": `${lerp(30, 0, heroEnter).toFixed(2)}px`,
    "--hero-y": `${lerp(20, 0, heroEnter).toFixed(2)}px`,
    "--exploded-o": explodedO.toFixed(4),
    "--exploded-scale": (lerp(1.08, 1, explodedEnter) * lerp(1, 0.92, catalogEnter)).toFixed(4),
    "--exploded-x": "0px",
    "--exploded-y": `${lerp(24, 0, explodedEnter).toFixed(2)}px`,
    "--frame-o": frameO.toFixed(4),
    "--frame-inset": frameInset,
    "--tint-o": tintO.toFixed(4),
    "--intro-o": (1 - introExit).toFixed(4),
    "--intro-y": `${lerp(0, -36, introExit).toFixed(2)}px`,
    "--na-o": na.toFixed(4),
    "--na-y": `${lerp(22, 0, na).toFixed(2)}px`,
    "--nb-o": nb.toFixed(4),
    "--nb-y": `${lerp(22, 0, nb).toFixed(2)}px`,
    "--catalog-o": catalogEnter.toFixed(4),
    "--catalog-x": `${lerp(42, 0, catalogEnter).toFixed(2)}vw`,
    "--catalog-controls": settle.toFixed(4),
    catalogInteractive: catalogEnter > 0.55,
  };
}

function applyScene(vars) {
  const { catalogInteractive, ...cssVars } = vars;
  for (const [key, value] of Object.entries(cssVars)) {
    els.root.style.setProperty(key, value);
  }
  if (els.catalog) {
    els.catalog.classList.toggle("is-interactive", Boolean(catalogInteractive));
  }
}

function requestTick() {
  if (state.needsFrame) return;
  state.needsFrame = true;
  state.raf = requestAnimationFrame(tick);
}

function tick() {
  state.needsFrame = false;
  state.targetP = localProgress();

  const smoothing = state.reducedMotion ? 1 : 0.14;
  state.visualP = lerp(state.visualP, state.targetP, smoothing);

  const ptrSmooth = state.reducedMotion || state.coarsePointer ? 1 : 0.1;
  state.ptrX = lerp(state.ptrX, state.ptrTargetX, ptrSmooth);
  state.ptrY = lerp(state.ptrY, state.ptrTargetY, ptrSmooth);
  els.root.style.setProperty("--ptr-x", state.ptrX.toFixed(4));
  els.root.style.setProperty("--ptr-y", state.ptrY.toFixed(4));

  applyScene(computeScene(state.visualP));

  const stillMoving =
    Math.abs(state.visualP - state.targetP) > 0.00035 ||
    Math.abs(state.ptrX - state.ptrTargetX) > 0.001 ||
    Math.abs(state.ptrY - state.ptrTargetY) > 0.001;

  if (stillMoving) requestTick();
}

function jumpToProgress(p) {
  measure();
  const y = state.geometry.top + clamp(p, 0, 1) * state.geometry.travel;
  window.scrollTo({
    top: y,
    behavior: state.reducedMotion ? "auto" : "smooth",
  });
  requestTick();
}

async function preloadCritical() {
  const imgs = [...document.querySelectorAll("img[data-critical]")];
  await Promise.all(
    imgs.map(async (img) => {
      try {
        if (img.decode) await img.decode();
        else if (!img.complete) {
          await new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
        }
      } catch {
        /* continue with available assets */
      }
    })
  );
}

function setupCatalog() {
  const track = els.track;
  if (!track) return;

  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let activeIndex = 0;

  const cards = () => [...track.querySelectorAll(".spec-card")];

  const updateStatus = () => {
    const list = cards();
    if (!list.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    list.forEach((card, i) => {
      const mid = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    activeIndex = best;
    if (els.status) els.status.textContent = `${best + 1} / ${list.length}`;
  };

  const scrollByCard = (dir) => {
    const list = cards();
    if (!list.length) return;
    const next = clamp(activeIndex + dir, 0, list.length - 1);
    list[next].scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", inline: "start", block: "nearest" });
  };

  els.prev?.addEventListener("click", () => scrollByCard(-1));
  els.next?.addEventListener("click", () => scrollByCard(1));

  track.addEventListener("scroll", () => updateStatus(), { passive: true });

  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCard(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCard(-1);
    }
  });

  track.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    track.scrollLeft = startScroll - dx;
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    try {
      track.releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    updateStatus();
  };

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  updateStatus();
}

function setupNav() {
  document.querySelectorAll("[data-jump]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const raw = el.getAttribute("data-jump");
      if (raw == null) return;
      if (el.tagName === "A") e.preventDefault();
      jumpToProgress(Number(raw));
    });
  });
}

function setupPointer() {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (state.reducedMotion || state.coarsePointer) {
        state.ptrTargetX = 0;
        state.ptrTargetY = 0;
        return;
      }
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      state.ptrTargetX = clamp(x, -1, 1);
      state.ptrTargetY = clamp(y, -1, 1);
      requestTick();
    },
    { passive: true }
  );
}

function setupMotionPrefs() {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const apply = () => {
    state.reducedMotion = mq.matches;
    state.coarsePointer = coarse.matches;
    document.body.classList.toggle("is-reduced", state.reducedMotion);
    if (state.reducedMotion && els.reducedFlow) {
      // Keep cinematic readable via CSS; optional flow stays hidden when CSS handles it
      els.reducedFlow.hidden = true;
    }
    requestTick();
  };
  apply();
  mq.addEventListener?.("change", apply);
  coarse.addEventListener?.("change", apply);
}

async function init() {
  if (!els.section) return;
  setupMotionPrefs();
  measure();
  setupNav();
  setupCatalog();
  setupPointer();

  window.addEventListener(
    "scroll",
    () => {
      requestTick();
    },
    { passive: true }
  );
  window.addEventListener(
    "resize",
    () => {
      measure();
      requestTick();
    },
    { passive: true }
  );

  await preloadCritical();
  state.ready = true;
  els.loader?.classList.add("is-done");
  requestTick();

  // Warm late assets without blocking first paint
  document.querySelectorAll("img[data-lazy-late]").forEach((img) => {
    if (img.decode) img.decode().catch(() => {});
  });
}

init();
