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
  if (frame < 28) return 'Finished seatpost'
  if (frame < 55) return 'Clamp head and hardware'
  if (frame < 82) return 'Rail cradle separation'
  return 'Full component breakdown'
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
            aria-label="Loading"
          >
            <div className="loader__bar" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const [loadProgress, setLoadProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)
  const [stageCaption, setStageCaption] = useState(captionForFrame(1))

  const framesRef = useRef([])
  const scrubRef = useRef(null)
  const canvasRef = useRef(null)
  const captionRef = useRef(null)
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
    if (!img || !img.complete || !img.naturalWidth) return

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight
    if (cssW < 2 || cssH < 2) return

    const nextW = Math.floor(cssW * dpr)
    const nextH = Math.floor(cssH * dpr)
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW
      canvas.height = nextH
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(0, 0, cssW, cssH)

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
      await loadImage(BIKE.webp)
      if (cancelled) return
      setLoadProgress(5)

      const total = frameUrls.length
      const batch = 8
      for (let i = 0; i < total; i += batch) {
        const slice = frameUrls.slice(i, i + batch)
        const loaded = await Promise.all(slice.map(loadImage))
        images.push(...loaded)
        if (!cancelled) {
          setLoadProgress(5 + (Math.min(total, i + slice.length) / total) * 95)
        }
      }

      if (cancelled) return
      framesRef.current = images
      setLoadProgress(100)
      window.setTimeout(() => {
        if (!cancelled) setAssetsReady(true)
      }, 200)
    })()

    return () => {
      cancelled = true
    }
  }, [frameUrls])

  useEffect(() => {
    if (!assetsReady) return
    const paint = () => drawFrame(reduceMotion ? FRAME_COUNT : 1)
    paint()
    const id = window.requestAnimationFrame(paint)
    return () => window.cancelAnimationFrame(id)
  }, [assetsReady, reduceMotion])

  useGSAP(
    () => {
      if (reduceMotion || !assetsReady) return
      const stage = scrubRef.current
      if (!stage) return

      progressObj.current.frame = 1
      drawFrame(1)
      setStageCaption(captionForFrame(1))

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=3600',
          pin: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => drawFrame(Math.round(progressObj.current.frame)),
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
            setStageCaption(captionForFrame(f))
            drawFrame(f)
          },
        },
        0,
      )

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
          </nav>
          <GhostButton href="#fit">Fit guide</GhostButton>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="shell hero__layout">
            <div className="hero__copy">
              <p className="caption">3K carbon fibre seatpost</p>
              <h1 className="feature-heading">
                Stiffer under power. Lighter on the climb. Steady at the saddle.
              </h1>
              <p className="body hero__lede">
                Hollow carbon shaft, machined clamp head, two-bolt rail cradle. Built for race and
                endurance bikes that need mass savings without flex at the seat tube.
              </p>
              <div className="hero__actions">
                <GhostButton href="#build">See the assembly</GhostButton>
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
              <h2 className="heading">3K carbon fibre rod</h2>
              <p className="body">
                The shaft is a hollow 3K twill tube under clear coat. Layup is set for axial and bending
                stiffness where the post meets the frame. Versus alloy posts of the same diameter, you
                get lower mass with controlled flex in the primary load plane.
              </p>
              <ul className="meta-list">
                <li>Diameters: 27.2 mm and 31.6 mm</li>
                <li>Target mass: ~180 g (27.2 × 350 mm)</li>
                <li>Two-bolt cradle with side angle adjust</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="scrub-stage" id="build" ref={scrubRef} aria-label="Seatpost assembly">
          <div className="scrub-stage__inner shell">
            <canvas
              className="scrub-canvas"
              ref={canvasRef}
              role="img"
              aria-label="Composite Speed seatpost assembly"
            />
            <p className="scrub-caption" ref={captionRef}>
              {stageCaption}
            </p>
          </div>
        </section>

        <section className="band" id="benefits">
          <div className="shell two-col">
            <p className="caption">On the bike</p>
            <div>
              <h2 className="heading">What changes for the rider</h2>
              <div className="benefit-grid">
                <article>
                  <h3 className="heading-sm">Power transfer</h3>
                  <p className="body">
                    Less seatpost flex in seated sprints means more of your input stays in the
                    drivetrain instead of bending the post.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Climbing mass</h3>
                  <p className="body">
                    Carbon cuts weight at a high point on the bike, which helps when the road tilts up
                    without changing your fit.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Road vibration</h3>
                  <p className="body">
                    The composite shaft damps high-frequency buzz through the saddle, so long days in
                    the drops cost less in fatigue.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Saddle angle</h3>
                  <p className="body">
                    The clamp holds rail pitch after install. Set it once; it stays put under braking
                    and climbing loads.
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
              <h2 className="heading">Fit and torque</h2>
              <p className="body">
                Use carbon paste at the seat tube. Torque the frame clamp to your frame maker’s
                specification. Stay above the minimum insertion mark. Confirm diameter and cut length
                against stack and setback before you cut.
              </p>
            </div>
          </div>
        </section>

        <section className="cta-band" id="fit">
          <div className="shell cta-band__inner">
            <div>
              <p className="caption">Fit guide</p>
              <h2 className="heading">Tell us diameter, length, and rails</h2>
              <p className="body">
                Send seat-tube size, post length you need, and saddle rail type. We’ll confirm the
                matching Composite Speed build.
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
          <p>COMPOSITE SPEED®</p>
          <div className="site-footer__links">
            <a href="#material">Material</a>
            <a href="#build">Assembly</a>
            <a href="mailto:fit@compositespeed.example">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
