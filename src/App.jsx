import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import './App.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ASSETS = {
  bike: { webp: '/assets/20-context-bike.webp', jpg: '/assets/20-context-bike.jpg' },
  rod: { webp: '/assets/30-hero-rod.webp', jpg: '/assets/30-hero-rod.jpg' },
  exploded: { webp: '/assets/35-exploded.webp', jpg: '/assets/35-exploded.jpg' },
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
          <div className="loader__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div className="loader__bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="loader__copy">Loading product assets… {Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const [loadProgress, setLoadProgress] = useState(0)
  const [assetsReady, setAssetsReady] = useState(false)

  const explodeRef = useRef(null)
  const assembledRef = useRef(null)
  const explodedRef = useRef(null)
  const labelARef = useRef(null)
  const labelBRef = useRef(null)
  const labelCRef = useRef(null)
  const hintRef = useRef(null)
  const stageBgRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const urls = [
      ASSETS.bike.webp,
      ASSETS.rod.webp,
      ASSETS.exploded.webp,
    ]

    const loadOne = (src) =>
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = src
      })

    ;(async () => {
      let done = 0
      for (const url of urls) {
        await loadOne(url)
        done += 1
        if (!cancelled) setLoadProgress((done / urls.length) * 100)
      }
      if (!cancelled) {
        setLoadProgress(100)
        window.setTimeout(() => setAssetsReady(true), 280)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useGSAP(
    () => {
      if (reduceMotion || !assetsReady) return

      const stage = explodeRef.current
      const assembled = assembledRef.current
      const exploded = explodedRef.current
      const hint = hintRef.current
      const bg = stageBgRef.current
      if (!stage || !assembled || !exploded) return

      gsap.set(assembled, { opacity: 0, scale: 0.88, y: 40 })
      gsap.set(exploded, { opacity: 0, scale: 0.96, y: 24 })
      gsap.set([labelARef.current, labelBRef.current, labelCRef.current], { opacity: 0, y: 16 })
      if (hint) gsap.set(hint, { autoAlpha: 1 })
      if (bg) gsap.set(bg, { backgroundColor: '#111111' })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=3200',
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // Beat 1: studio reveal + assembled rod
      tl.to(bg, { backgroundColor: '#f4f4f4', ease: 'none', duration: 0.2 }, 0)
        .to(assembled, { opacity: 1, scale: 1, y: 0, ease: 'none', duration: 0.22 }, 0.08)
        .to(hint, { autoAlpha: 0, ease: 'none', duration: 0.12 }, 0.18)

      // Beat 2: hold assembled + first callout
      tl.to(labelARef.current, { opacity: 1, y: 0, ease: 'none', duration: 0.12 }, 0.28)

      // Beat 3–5: crossfade to exploded engineering view
      tl.to(assembled, { opacity: 0, scale: 0.94, y: -20, ease: 'none', duration: 0.22 }, 0.42)
        .to(exploded, { opacity: 1, scale: 1, y: 0, ease: 'none', duration: 0.24 }, 0.44)
        .to(labelARef.current, { opacity: 0, y: -10, ease: 'none', duration: 0.1 }, 0.46)
        .to(labelBRef.current, { opacity: 1, y: 0, ease: 'none', duration: 0.12 }, 0.55)
        .to(labelCRef.current, { opacity: 1, y: 0, ease: 'none', duration: 0.12 }, 0.68)

      // Beat 6: slight push into exploded detail
      tl.to(exploded, { scale: 1.06, y: -12, ease: 'none', duration: 0.22 }, 0.78)

      return () => {
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    },
    { dependencies: [reduceMotion, assetsReady], revertOnUpdate: true },
  )

  useEffect(() => {
    if (!assetsReady) return
    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [assetsReady])

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
            <a href="#engineering">Engineering</a>
            <a href="#benefits">Benefits</a>
            <a href="#explode">Build</a>
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
                <GhostButton href="#explode">Inspect the build</GhostButton>
                <a className="text-link" href="#benefits">
                  Cyclist benefits →
                </a>
              </div>
            </div>
            <figure className="hero__media">
              <picture>
                <source srcSet={ASSETS.bike.webp} type="image/webp" />
                <img
                  src={ASSETS.bike.jpg}
                  alt="Composite Speed carbon fibre seatpost mounted on a road bike"
                  width="1800"
                  height="1500"
                  decoding="async"
                />
              </picture>
            </figure>
          </div>
        </section>

        <section className="explode-stage" id="explode" ref={explodeRef} aria-label="Seatpost engineering scrub">
          <div className="explode-stage__bg" ref={stageBgRef} />
          <div className="explode-stage__inner shell">
            <p className="scrub-hint" ref={hintRef}>
              Scroll to scrub ↓
            </p>

            <div className="explode-stack">
              <div className="explode-media" ref={assembledRef}>
                <picture>
                  <source srcSet={ASSETS.rod.webp} type="image/webp" />
                  <img
                    src={ASSETS.rod.jpg}
                    alt="Assembled Composite Speed carbon fibre seatpost"
                    width="1600"
                    height="1600"
                  />
                </picture>
              </div>
              <div className="explode-media explode-media--exploded" ref={explodedRef}>
                <picture>
                  <source srcSet={ASSETS.exploded.webp} type="image/webp" />
                  <img
                    src={ASSETS.exploded.jpg}
                    alt="Exploded seatpost: bolts, clamp plates, carbon tube, end plug"
                    width="1600"
                    height="1600"
                  />
                </picture>
              </div>
            </div>

            <aside className="explode-labels" aria-live="polite">
              <p className="explode-label" ref={labelARef}>
                <span>01</span> Assembled post — clamp head bonded to 3K carbon tube
              </p>
              <p className="explode-label" ref={labelBRef}>
                <span>02</span> Two-bolt cradle + washers — rail clamp torque path
              </p>
              <p className="explode-label" ref={labelCRef}>
                <span>03</span> Hollow carbon shaft + ribbed end plug — sealed tube
              </p>
            </aside>
          </div>
        </section>

        <section className="band" id="engineering">
          <div className="shell two-col">
            <p className="caption">Material system</p>
            <div>
              <h2 className="heading">3K twill carbon fibre rod</h2>
              <p className="body">
                The shaft is a hollow 3K carbon fibre tube under a clear resin coat. Fibre orientation is
                set for hoop and axial load around the seat-tube interface. Compared with alloy posts of
                the same diameter, the composite layup cuts mass while keeping bending stiffness in the
                primary load plane.
              </p>
              <ul className="meta-list">
                <li>3K twill weave — inspectable fibre continuity</li>
                <li>Hollow tube with sealed end plug</li>
                <li>Common diameters: 27.2 mm and 31.6 mm</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="band" id="benefits">
          <div className="shell two-col">
            <p className="caption">Cyclist impact</p>
            <div>
              <h2 className="heading">What the engineering changes on the bike</h2>
              <div className="benefit-grid">
                <article>
                  <h3 className="heading-sm">Power transfer</h3>
                  <p className="body">
                    High axial and bending stiffness limits post flex under seated sprint loads, so more
                    rider input stays at the pedals instead of dissipating in the seatpost.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Mass budget</h3>
                  <p className="body">
                    Target mass is about 180 g in 27.2 × 350 mm (finish dependent). That weight comes off
                    a high point on the frame, which helps climbing and bike handling response.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Fatigue over distance</h3>
                  <p className="body">
                    Carbon’s damping characteristics reduce high-frequency road vibration transmitted
                    through the saddle, which lowers cumulative fatigue on long rides without adding
                    elastomer parts.
                  </p>
                </article>
                <article>
                  <h3 className="heading-sm">Saddle stability</h3>
                  <p className="body">
                    The two-bolt forged cradle and side micro-adjust hold rail pitch under load, so
                    saddle angle set at install stays consistent through climbing and braking.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="shell two-col">
            <p className="caption">Interface</p>
            <div>
              <h2 className="heading">Clamp and install requirements</h2>
              <p className="body">
                Use carbon assembly paste at the seat-tube interface and torque the clamp to the frame
                manufacturer’s specification. Do not exceed the marked minimum insertion depth. The
                post is compatible with standard seat tubes in 27.2 and 31.6; confirm length against
                your stack and setback before cutting.
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
                Send frame seat-tube diameter, required post length, and saddle rail type. We will
                confirm the Composite Speed build that matches your bike.
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
            <a href="#engineering">Engineering</a>
            <a href="#explode">Build</a>
            <a href="mailto:fit@compositespeed.example">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
