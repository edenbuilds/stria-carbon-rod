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
          aria-live="polite"
          aria-busy="true"
        >
          <p className="loader__mark">COMPOSITE SPEED®</p>
          <div
            className="loader__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div className="loader__bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="loader__copy">Loading frame sequence… {Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const [loadProgress, setLoadProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)
  const [frameIndex, setFrameIndex] = useState(1)

  const framesRef = useRef([])
  const scrubRef = useRef(null)
  const canvasRef = useRef(null)
  const hintRef = useRef(null)
  const labelRef = useRef(null)
  const progressObj = useRef({ frame: 1 })

  const frameUrls = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, i) => frameSrc(i + 1)),
    [],
  )

  const drawFrame = (index) => {
    const canvas = canvasRef.current
    const frames = framesRef.current
    if (!canvas || !frames.length) return
    const img = frames[index - 1]
    if (!img || !img.complete) return

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight
    if (cssW < 2 || cssH < 2) return

    if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    const scale = Math.min(cssW / img.naturalWidth, cssH / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = (cssW - w) / 2
    const y = (cssH - h) / 2
    ctx.drawImage(img, x, y, w, h)
  }

  useEffect(() => {
    let cancelled = false
    const images = []

    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(img)
        img.src = src
      })

    ;(async () => {
      // bike first for hero, then frames in batches
      await loadImage(BIKE.webp)
      if (cancelled) return
      setLoadProgress(4)

      const total = frameUrls.length
      let done = 0
      const batch = 8
      for (let i = 0; i < total; i += batch) {
        const slice = frameUrls.slice(i, i + batch)
        const loaded = await Promise.all(slice.map(loadImage))
        images.push(...loaded)
        done = Math.min(total, i + slice.length)
        if (!cancelled) setLoadProgress(4 + (done / total) * 96)
      }

      if (cancelled) return
      framesRef.current = images
      setLoadProgress(100)
      window.setTimeout(() => {
        if (!cancelled) {
          setAssetsReady(true)
          drawFrame(1)
        }
      }, 220)
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
      if (hintRef.current) gsap.set(hintRef.current, { autoAlpha: 1 })
      if (labelRef.current) gsap.set(labelRef.current, { autoAlpha: 0, y: 12 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=3600',
          pin: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: () => drawFrame(Math.round(progressObj.current.frame)),
        },
      })

      tl.to(
        progressObj.current,
        {
          frame: FRAME_COUNT,
          ease: 'none',
          duration: 1,
          onUpdate: () => {
            const f = Math.round(progressObj.current.frame)
            setFrameIndex(f)
            drawFrame(f)
          },
        },
        0,
      )

      if (hintRef.current) {
        tl.to(hintRef.current, { autoAlpha: 0, duration: 0.12, ease: 'none' }, 0.08)
      }
      if (labelRef.current) {
        tl.to(labelRef.current, { autoAlpha: 1, y: 0, duration: 0.15, ease: 'none' }, 0.2)
      }

      const onResize = () => {
        drawFrame(Math.round(progressObj.current.frame))
        ScrollTrigger.refresh()
      }
      window.addEventListener('resize', onResize)

      return () => {
        window.removeEventListener('resize', onResize)
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    },
    { dependencies: [assetsReady, reduceMotion], revertOnUpdate: true },
  )

  useEffect(() => {
    if (!assetsReady) return
    drawFrame(reduceMotion ? FRAME_COUNT : 1)
  }, [assetsReady, reduceMotion])

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
            <a href="#build">Build</a>
            <a href="#benefits">Benefits</a>
          </nav>
          <GhostButton href="#fit">Fit guide</GhostButton>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="shell hero__layout">
            <div className="hero__copy">
              <p className="caption">Carbon fibre seatpost</p>
              <h1 className="display">COMPOSITE SPEED®</h1>
              <p className="feature-heading">
                A 3K carbon fibre rod engineered for stiffness, mass reduction, and stable saddle control.
              </p>
              <div className="hero__actions">
                <GhostButton href="#build">Inspect the build</GhostButton>
                <a className="text-link" href="#benefits">
                  Cyclist benefits →
                </a>
              </div>
            </div>
            <figure className="hero__media">
              <picture>
                <source srcSet={BIKE.webp} type="image/webp" />
                <img
                  src={BIKE.jpg}
                  alt="Composite Speed carbon fibre seatpost mounted on a road bike"
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
            <p className="caption">Below the hero</p>
            <div>
              <h2 className="heading">What you are looking at</h2>
              <p className="body">
                The product is a hollow 3K carbon fibre seatpost rod with a machined clamp head. Fibre
                orientation is set for axial and bending stiffness at the seat-tube interface. The
                sequence below scrubs the full assembly: from the finished post to an exploded view of
                bolts, clamp plates, washers, tube, and end plug.
              </p>
              <ul className="meta-list">
                <li>3K twill carbon shaft under clear coat</li>
                <li>Two-bolt rail cradle with side micro-adjust</li>
                <li>Target mass ~180 g (27.2 × 350 mm, finish dependent)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="scrub-stage" id="build" ref={scrubRef} aria-label="Seatpost frame scrub">
          <div className="scrub-stage__inner shell">
            <p className="scrub-hint" ref={hintRef}>
              Scroll to scrub ↓
            </p>
            <canvas
              className="scrub-canvas"
              ref={canvasRef}
              role="img"
              aria-label="Composite Speed seatpost assembly sequence"
            />
            <div className="scrub-meta" ref={labelRef}>
              <p className="caption">Build sequence</p>
              <p className="scrub-frame">
                Frame {String(frameIndex).padStart(3, '0')} / {FRAME_COUNT}
              </p>
              <p className="body scrub-note">
                Assembled post → clamp hardware → exploded carbon tube. Scrub maps 1:1 to scroll.
              </p>
            </div>
          </div>
        </section>

        <section className="band" id="benefits">
          <div className="shell two-col">
            <p className="caption">Cyclist impact</p>
            <div>
              <h2 className="heading">Engineering effects on the bike</h2>
              <div className="benefit-grid">
                <article>
                  <h3 className="heading-sm">Power transfer</h3>
                  <p className="body">
                    High bending stiffness limits seatpost flex under seated sprint loads, so more rider
                    input stays at the drivetrain.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Mass budget</h3>
                  <p className="body">
                    Carbon replaces alloy in a high point on the bike. Lower rotating and climbing mass
                    without changing frame geometry.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Vibration load</h3>
                  <p className="body">
                    Composite damping reduces high-frequency road input through the saddle, cutting
                    cumulative fatigue on long rides.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Saddle lock</h3>
                  <p className="body">
                    Two-bolt cradle and side adjuster hold rail pitch after install, so set angle stays
                    consistent under braking and climbing.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="shell two-col">
            <p className="caption">Install</p>
            <div>
              <h2 className="heading">Interface requirements</h2>
              <p className="body">
                Use carbon assembly paste at the seat tube. Torque the frame clamp to the manufacturer
                spec. Do not go below the marked minimum insertion. Available in 27.2 and 31.6 mm —
                confirm length against stack and setback before cutting.
              </p>
            </div>
          </div>
        </section>

        <section className="cta-band" id="fit">
          <div className="shell cta-band__inner">
            <div>
              <p className="caption">Fit guide</p>
              <h2 className="heading">Confirm diameter, length, and rail standard</h2>
              <p className="body">
                Send seat-tube diameter, required post length, and saddle rail type. We will confirm the
                Composite Speed build for your bike.
              </p>
            </div>
            <GhostButton href="mailto:fit@compositespeed.example?subject=Composite%20Speed%20fit%20guide">
              Request fit guide
            </GhostButton>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <p>COMPOSITE SPEED® carbon fibre seatpost</p>
          <div className="site-footer__links">
            <a href="#material">Material</a>
            <a href="#build">Build</a>
            <a href="mailto:fit@compositespeed.example">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
