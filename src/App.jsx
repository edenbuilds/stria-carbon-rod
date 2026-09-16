import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import './App.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const FRAME_COUNT = 104
const BIKE = {
  webp: '/assets/20-context-bike.webp',
  jpg: '/assets/20-context-bike.jpg',
}

const frameSrc = (i) => `/assets/frames/frame-${String(i).padStart(3, '0')}.jpg`

function captionForFrame(frame) {
  if (frame < 28) return 'Complete seatpost'
  if (frame < 55) return 'Clamp and hardware'
  if (frame < 82) return 'Rail cradle'
  return 'Component layout'
}

function GhostButton({ href, children, className = '' }) {
  return (
    <motion.a
      href={href}
      className={`ghost-pill ${className}`}
      whileHover={{ backgroundColor: '#000000', color: '#ffffff' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.a>
  )
}

function Loader({ progress, done }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          aria-busy="true"
        >
          <p className="loader__mark">COMPOSITE SPEED®</p>
          <div
            className="loader__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Loading"
          >
            <div className="loader__bar" style={{ width: `${Math.max(progress, 6)}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const [loadProgress, setLoadProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)
  const [activeSrc, setActiveSrc] = useState(frameSrc(1))
  const [stageCaption, setStageCaption] = useState(captionForFrame(1))
  const [isMobile, setIsMobile] = useState(false)

  const scrubRef = useRef(null)
  const progressObj = useRef({ frame: 1 })
  const lastDrawn = useRef(0)
  const readyFrames = useRef(new Set([1]))

  const frameUrls = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, i) => frameSrc(i + 1)),
    [],
  )

  const showFrame = (index) => {
    const clamped = Math.max(1, Math.min(FRAME_COUNT, index))
    // Prefer a loaded frame so mobile never flashes blanks
    let target = clamped
    if (!readyFrames.current.has(target)) {
      let found = 1
      for (const ready of readyFrames.current) {
        if (Math.abs(ready - clamped) < Math.abs(found - clamped)) found = ready
      }
      target = found
    }
    if (target === lastDrawn.current) {
      setStageCaption(captionForFrame(clamped))
      return
    }
    lastDrawn.current = target
    setActiveSrc(frameSrc(target))
    setStageCaption(captionForFrame(clamped))
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      await loadImage(BIKE.webp)
      if (cancelled) return
      setLoadProgress(8)

      // First frame must paint before we reveal — then warm the rest in parallel
      const firstOk = await loadImage(frameUrls[0])
      if (cancelled) return
      if (firstOk) readyFrames.current.add(1)
      showFrame(1)
      setLoadProgress(18)

      // Warm a small head batch so early scroll is solid
      const head = frameUrls.slice(1, 12)
      await Promise.all(
        head.map(async (src, i) => {
          const ok = await loadImage(src)
          if (ok) readyFrames.current.add(i + 2)
        }),
      )
      if (cancelled) return
      setLoadProgress(42)
      setAssetsReady(true)

      // Remaining frames in parallel batches (does not block UI)
      const rest = frameUrls.slice(12)
      const batchSize = 8
      for (let i = 0; i < rest.length; i += batchSize) {
        if (cancelled) return
        const batch = rest.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (src, j) => {
            const frameIndex = 13 + i + j
            const ok = await loadImage(src)
            if (ok) readyFrames.current.add(frameIndex)
          }),
        )
        if (cancelled) return
        const done = 12 + Math.min(i + batch.length, rest.length)
        setLoadProgress(42 + (done / FRAME_COUNT) * 58)
      }

      if (!cancelled) setLoadProgress(100)
    })()

    return () => {
      cancelled = true
    }
  }, [frameUrls])

  useGSAP(
    () => {
      if (reduceMotion || !assetsReady) return
      const stage = scrubRef.current
      if (!stage) return

      progressObj.current.frame = 1
      showFrame(1)

      const mobile = window.matchMedia('(max-width: 720px)').matches

      // Mobile: CSS sticky section + scrub without pin (pin blanks on iOS)
      // Desktop: classic pinned scrub
      const trigger = {
        trigger: stage,
        start: 'top top',
        end: mobile ? 'bottom bottom' : '+=3600',
        scrub: mobile ? 0.2 : 0.75,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        ...(mobile
          ? {}
          : {
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
            }),
      }

      const tl = gsap.timeline({ scrollTrigger: trigger })

      tl.to(progressObj.current, {
        frame: FRAME_COUNT,
        ease: 'none',
        duration: 1,
        onUpdate: () => {
          showFrame(Math.round(progressObj.current.frame))
        },
      })

      const onResize = () => ScrollTrigger.refresh()
      window.addEventListener('resize', onResize)
      requestAnimationFrame(() => {
        showFrame(1)
        ScrollTrigger.refresh()
      })

      return () => {
        window.removeEventListener('resize', onResize)
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    },
    { dependencies: [assetsReady, reduceMotion, isMobile], revertOnUpdate: true },
  )

  return (
    <>
      <Loader progress={loadProgress} done={assetsReady} />

      <a className="skip-link" href="#fit">
        Skip to fit guide
      </a>

      <header className="site-header">
        <div className="shell site-header__inner">
          <a className="wordmark" href="#top">
            COMPOSITE SPEED®
          </a>
          <nav className="site-nav" aria-label="Primary">
            <a href="#material">Material</a>
            <a href="#build">Assembly</a>
            <a href="#benefits">Benefits</a>
            <a href="#fit">Fit</a>
          </nav>
          <GhostButton href="#fit">Fit guide</GhostButton>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="shell hero__layout">
            <div className="hero__copy">
              <p className="caption">Carbon fibre seatpost</p>
              <h1 className="feature-heading">
                Less mass. More stiffness. Stable saddle control.
              </h1>
              <p className="body hero__lede">
                A hollow 3K carbon shaft with a machined clamp. Made for riders who want climbing
                weight savings without flex under seated power.
              </p>
              <div className="hero__actions">
                <GhostButton href="#build">See how it’s built</GhostButton>
                <a className="text-link" href="#benefits">
                  Rider benefits →
                </a>
              </div>
            </div>
            <figure className="hero__media">
              <picture>
                <source srcSet={BIKE.webp} type="image/webp" />
                <img
                  src={BIKE.jpg}
                  alt="Composite Speed carbon fibre seatpost on a road bike"
                  width="1800"
                  height="1500"
                  decoding="async"
                />
              </picture>
            </figure>
          </div>
        </section>

        <section className="band" id="material">
          <div className="shell two-col">
            <p className="caption">Material</p>
            <div>
              <h2 className="heading">3K carbon fibre construction</h2>
              <p className="body">
                The tube uses a 3K twill layup under clear coat. Fibres are oriented for stiffness at
                the seat-tube interface. You get lower mass than alloy at the same diameter, with
                controlled bending under load.
              </p>
              <ul className="meta-list">
                <li>27.2 mm and 31.6 mm diameters</li>
                <li>~180 g target (27.2 × 350 mm)</li>
                <li>Two-bolt cradle with side angle adjust</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className={`build-stage${isMobile ? ' build-stage--mobile' : ''}`}
          id="build"
          ref={scrubRef}
          aria-label="Seatpost assembly"
        >
          <div className="build-stage__sticky">
            <div className="build-stage__inner shell">
              <img
                className="build-image"
                src={activeSrc}
                alt="Composite Speed seatpost assembly"
                width={1280}
                height={720}
                decoding="async"
                fetchPriority="high"
                draggable={false}
              />
              <p className="build-caption">{stageCaption}</p>
            </div>
          </div>
        </section>

        <section className="band" id="benefits">
          <div className="shell two-col">
            <p className="caption">On the bike</p>
            <div>
              <h2 className="heading">What it does for the rider</h2>
              <div className="benefit-grid">
                <article>
                  <h3 className="heading-sm">Power transfer</h3>
                  <p className="body">
                    Reduced flex in seated sprints keeps more of your effort in the drivetrain.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Climbing weight</h3>
                  <p className="body">
                    Carbon removes grams high on the bike, which helps when the gradient rises.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Road buzz</h3>
                  <p className="body">
                    The composite shaft damps high-frequency vibration through the saddle on long
                    rides.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Saddle hold</h3>
                  <p className="body">
                    The clamp keeps rail angle after install under braking and climbing loads.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="band" id="install">
          <div className="shell two-col">
            <p className="caption">Install</p>
            <div>
              <h2 className="heading">Fit and torque</h2>
              <p className="body">
                Use carbon paste at the seat tube. Torque the frame clamp to your frame maker’s
                spec. Stay above the minimum insertion mark. Confirm diameter and length before
                cutting.
              </p>
            </div>
          </div>
        </section>

        <section className="cta-band" id="fit">
          <div className="shell cta-band__inner">
            <div>
              <p className="caption">Fit guide</p>
              <h2 className="heading">Share diameter, length, and rails</h2>
              <p className="body">
                Send seat-tube size, the post length you need, and saddle rail type. We’ll confirm
                the matching Composite Speed build.
              </p>
            </div>
            <GhostButton href="mailto:fit@compositespeed.example?subject=Composite%20Speed%20fit%20guide">
              Request fit guide
            </GhostButton>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__grid">
          <div className="site-footer__brand">
            <p className="wordmark">COMPOSITE SPEED®</p>
            <p className="site-footer__tag">
              Carbon fibre seatposts for race and endurance builds.
            </p>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__label">Product</p>
            <a href="#material">Material</a>
            <a href="#build">Assembly</a>
            <a href="#benefits">Benefits</a>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__label">Support</p>
            <a href="#fit">Fit guide</a>
            <a href="mailto:fit@compositespeed.example">Email support</a>
            <a href="#install">Install notes</a>
          </div>

          <div className="site-footer__col">
            <p className="site-footer__label">Specs</p>
            <span>27.2 / 31.6 mm</span>
            <span>~180 g (27.2 × 350)</span>
            <span>2-bolt cradle</span>
          </div>
        </div>

        <div className="shell site-footer__bottom">
          <p>© {new Date().getFullYear()} Composite Speed</p>
          <p>Engineering-first carbon components</p>
        </div>
      </footer>
    </>
  )
}
