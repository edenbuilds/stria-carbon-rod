import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import './App.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const BIKE_IMG = '/assets/20-context-bike.webp'
const BIKE_FALLBACK = '/assets/20-context-bike.jpg'

function GhostButton({ href, children, variant = 'dark', className = '' }) {
  return (
    <motion.a
      href={href}
      className={`ghost-pill ghost-pill--${variant} ${className}`}
      whileHover={{ backgroundColor: variant === 'dark' ? '#000000' : '#ffffff', color: variant === 'dark' ? '#ffffff' : '#000000' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.a>
  )
}

function TextLink({ href, children }) {
  return (
    <a className="text-link" href={href}>
      {children}
      <span aria-hidden="true"> →</span>
    </a>
  )
}

export default function App() {
  const reduceMotion = useReducedMotion()
  const productRef = useRef(null)
  const productMediaRef = useRef(null)
  const productCaptionRef = useRef(null)
  const scrubHintRef = useRef(null)

  useGSAP(
    () => {
      if (reduceMotion) return

      const media = productMediaRef.current
      const caption = productCaptionRef.current
      const hint = scrubHintRef.current
      if (!media || !productRef.current) return

      gsap.set(media, { scale: 0.82, y: 64, opacity: 0.25 })
      gsap.set(caption, { y: 32, opacity: 0 })
      if (hint) gsap.set(hint, { opacity: 1 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: productRef.current,
          start: 'top top',
          end: '+=2800',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      tl.to(media, { scale: 1, y: 0, opacity: 1, ease: 'none', duration: 0.5 }, 0)
        .to(caption, { y: 0, opacity: 1, ease: 'none', duration: 0.3 }, 0.28)

      if (hint) {
        tl.to(hint, { opacity: 0, ease: 'none', duration: 0.25 }, 0.35)
      }

      tl.to(media, { scale: 1.06, y: -16, ease: 'none', duration: 0.5 }, 0.5)

      return () => {
        tl.scrollTrigger?.kill()
        tl.kill()
      }
    },
    { dependencies: [reduceMotion], revertOnUpdate: true },
  )

  useEffect(() => {
    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <a className="skip-link" href="#fit">
        Skip to fit guide
      </a>

      <header className="site-header">
        <div className="shell site-header__inner">
          <a className="wordmark" href="#top">
            STRIA®
          </a>
          <nav className="site-nav" aria-label="Primary">
            <a href="#story">How it works</a>
            <a href="#material">Material</a>
            <a href="#product">Product</a>
          </nav>
          <GhostButton href="#fit">Fit guide</GhostButton>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="shell hero__grid">
            <motion.p
              className="caption"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Precision carbon seatpost
            </motion.p>
            <motion.h1
              className="display"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              STRIA®
            </motion.h1>
            <motion.p
              className="feature-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              Carbon held where you sit.
            </motion.p>
            <motion.div
              className="hero__actions"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <GhostButton href="#product">Scroll the product</GhostButton>
              <TextLink href="#story">Read the system</TextLink>
            </motion.div>
          </div>
        </section>

        <section className="band" id="story">
          <div className="shell two-col">
            <p className="caption">Never let a vague tube decide your ride feel.</p>
            <div>
              <h2 className="heading">Clamp geometry that stays honest under load.</h2>
              <p className="body">
                Two-bolt rail cradle, machined head, and a side adjuster keep saddle pitch precise —
                so the carbon shaft can do the quiet work of stiffness and compliance.
              </p>
            </div>
          </div>
        </section>

        <section className="band band--tight" id="material">
          <div className="shell two-col">
            <p className="caption">3K weave, clear coat</p>
            <div>
              <h2 className="heading-sm">Structure you can read.</h2>
              <p className="body">
                The checkerboard carbon is not decoration. Aligned fibers under a satin resin skin
                give the post its language — hollow, sealed, continuous.
              </p>
              <ul className="meta-list">
                <li>CNC aluminum head</li>
                <li>27.2 / 31.6 diameters</li>
                <li>~180 g target (27.2 × 350)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="product-stage" id="product" ref={productRef} aria-label="Product reveal">
          <div className="product-stage__inner shell">
            <p className="scrub-hint" ref={scrubHintRef} aria-hidden="true">
              Scroll to scrub ↓
            </p>
            <figure className="product-frame" ref={productMediaRef}>
              <picture>
                <source srcSet={BIKE_IMG} type="image/webp" />
                <img
                  src={BIKE_FALLBACK}
                  alt="STRIA carbon fibre seatpost installed on a matte gray road bike with a white racing saddle"
                  width="1800"
                  height="1500"
                  decoding="async"
                />
              </picture>
            </figure>
            <div className="product-caption" ref={productCaptionRef}>
              <p className="caption">In situ</p>
              <h2 className="heading-sm">The seatpost, where it belongs.</h2>
            </div>
          </div>
        </section>

        <section className="cta-band" id="fit">
          <div className="shell cta-band__inner">
            <div>
              <p className="caption">Fit guide</p>
              <h2 className="heading">Confirm diameter, length, and rails.</h2>
              <p className="body">
                Tell us your frame standard and saddle rails — we’ll confirm the right STRIA build.
              </p>
            </div>
            <GhostButton href="mailto:fit@stria.example?subject=STRIA%20fit%20guide">
              Request fit guide
            </GhostButton>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__inner">
          <p>STRIA® carbon fibre seatpost</p>
          <div className="site-footer__links">
            <a href="#story">How it works</a>
            <a href="#product">Product</a>
            <a href="mailto:fit@stria.example">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
