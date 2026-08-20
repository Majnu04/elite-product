'use client';

import { useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { store } from '@/lib/store';
import { windowOpacity, prefersReducedMotion, isMobileDevice } from '@/lib/utils';
import { sceneTextBlocks } from '@/lib/constants';
import Scene from './Scene';

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderBarRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const cxRef = useRef(0);
  const cyRef = useRef(0);
  const txRef = useRef(0);
  const tyRef = useRef(0);

  /* ==================== INITIALIZATION ==================== */
  useEffect(() => {
    store.isMobile = isMobileDevice();
    store.isReducedMotion = prefersReducedMotion();

    // Loader bar animation
    if (loaderBarRef.current) {
      gsap.to(loaderBarRef.current, {
        width: '100%',
        duration: 1.6,
        delay: 0.3,
        ease: 'power2.out',
      });
    }

    // Hide loader after delay
    const hideTimer = setTimeout(() => {
      if (loaderRef.current) loaderRef.current.classList.add('hidden');
      store.isReady = true;
    }, 2200);

    // ---- Lenis smooth scroll ----
    const lenis = new Lenis({
      duration: store.isReducedMotion ? 0.1 : 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // ---- ScrollTrigger ----
    if (!store.isReducedMotion && scrollRef.current) {
      ScrollTrigger.create({
        trigger: scrollRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          store.targetProgress = self.progress;
        },
      });
    }

    // ---- Resize handler ----
    const onResize = () => {
      store.isMobile = isMobileDevice();
    };
    window.addEventListener('resize', onResize);

    // ---- Nav scroll effect ----
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 40);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(hideTimer);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* ==================== TEXT ANIMATION RAF ==================== */
  useEffect(() => {
    if (store.isReducedMotion) {
      // Show all text in reduced mode
      sceneTextBlocks.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none';
        }
      });
      return;
    }

    let raf: number;
    const update = () => {
      const p = store.progress;

      // Update scene text blocks
      sceneTextBlocks.forEach(({ id, start, end }) => {
        const el = document.getElementById(id);
        if (el) {
          const op = windowOpacity(p, start, end, 0.35);
          el.style.opacity = String(op);
          el.style.transform = `translateY(${10 * (1 - op)}px)`;
          el.style.filter = `blur(${5 * (1 - op)}px)`;
          el.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
        }
      });

      // Scroll indicator
      if (scrollIndicatorRef.current) {
        scrollIndicatorRef.current.style.opacity = String(
          Math.max(0, 1 - p / 0.04),
        );
      }

      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ==================== CURSOR ==================== */
  useEffect(() => {
    if (store.isMobile || store.isReducedMotion) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e: MouseEvent) => {
      txRef.current = e.clientX;
      tyRef.current = e.clientY;
      store.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      store.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    let raf: number;
    const loop = () => {
      cxRef.current += (txRef.current - cxRef.current) * 0.18;
      cyRef.current += (tyRef.current - cyRef.current) * 0.18;
      cursor.style.transform = `translate(${cxRef.current}px, ${cyRef.current}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Hover effect
    const addHoverListeners = () => {
      document.querySelectorAll('.hoverable').forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
      });
    };
    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  /* ==================== SCROLL TO ==================== */
  const scrollTo = useCallback((target: string) => {
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: store.isReducedMotion ? 'auto' : 'smooth' });
  }, []);

  /* ==================== NAV TOGGLE ==================== */
  const toggleNav = useCallback(() => {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.toggle('open');
  }, []);

  const closeNav = useCallback(() => {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('open');
  }, []);

  /* ==================== REVEAL ON SCROLL (editorial) ==================== */
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) en.target.classList.add('in');
          });
        },
        { threshold: 0.15 },
      );
      revealEls.forEach((el) => io.observe(el));
      return () => io.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add('in'));
    }
  }, []);

  /* ==================== RENDER ==================== */
  return (
    <>
      {/* Cursor */}
      {!store.isMobile && <div ref={cursorRef} className="custom-cursor" />}

      {/* Loader */}
      <div ref={loaderRef} className="loader-overlay">
        <h1>ELITE</h1>
        <p>EAU DE PARFUM</p>
        <div className="loader-bar-wrap">
          <div ref={loaderBarRef} className="loader-bar-fill" />
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="site-nav">
        <div className="nav-logo">ELITE</div>
        <ul className="nav-links" id="nav-links">
          <li>
            <a href="#scroll-container" className="hoverable" onClick={closeNav}>
              Experience
            </a>
          </li>
          <li>
            <a href="#product-info" className="hoverable" onClick={closeNav}>
              Fragrance
            </a>
          </li>
          <li>
            <a href="#brand-story" className="hoverable" onClick={closeNav}>
              Story
            </a>
          </li>
          <li>
            <a href="#final-cta" className="hoverable" onClick={closeNav}>
              Contact
            </a>
          </li>
        </ul>
        <button className="nav-toggle hoverable" onClick={toggleNav} aria-label="Toggle menu">
          <span />
          <span />
        </button>
      </nav>

      {/* Scroll container + sticky3D viewport */}
      <div
        ref={scrollRef}
        id="scroll-container"
        className="scroll-container"
        style={{ height: '920vh' }}
      >
        <div className="scroll-viewport">
          {/* Three.js Canvas */}
          <Canvas
            camera={{ position: [0, 0.3, 6], fov: 32, near: 0.1, far: 100 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
            dpr={[1, 1.5]}
            shadows
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <color attach="background" args={['#0a0908']} />
            <fog attach="fog" args={['#0a0908', 8, 40]} />
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>

          {/* Scene text overlays */}
          <div className="scene-text-layer">
            <div className="scene-block" id="hero-block">
              <h1>ELITE</h1>
              <p className="sub">A Scent Beyond Ordinary.</p>
            </div>
            <div className="scene-block" id="s-reveal">
              <span className="eyebrow">The Reveal</span>
              <h2>Designed to be remembered.</h2>
            </div>
            <div className="scene-block" id="s-cap">
              <span className="eyebrow">Precision</span>
              <h2>Precision in every detail.</h2>
            </div>
            <div className="scene-block" id="s-mist1">
              <span className="eyebrow">Fragrance</span>
              <h2>You can&apos;t see fragrance.</h2>
            </div>
            <div className="scene-block" id="s-mist2">
              <h2>You can feel it.</h2>
            </div>
            <div className="scene-block" id="s-note-top">
              <span className="eyebrow">Top Note</span>
              <h2>Bergamot</h2>
            </div>
            <div className="scene-block" id="s-note-heart">
              <span className="eyebrow">Heart Note</span>
              <h2>Iris</h2>
            </div>
            <div className="scene-block" id="s-note-base">
              <span className="eyebrow">Base Note</span>
              <h2>Oud</h2>
            </div>
            <div className="scene-block" id="s-exploded">
              <span className="eyebrow">Craft</span>
              <h2>Crafted with precision.</h2>
            </div>
            <div className="scene-block" id="s-flip">
              <span className="eyebrow">Impression</span>
              <h2>An impression that lasts.</h2>
            </div>
            <div className="scene-block" id="s-liquid">
              <span className="eyebrow">Essence</span>
              <h2>The essence of ELITE.</h2>
            </div>
            <div className="scene-block" id="s-reconstruct">
              <span className="eyebrow">Intention</span>
              <h2>Every detail has a purpose.</h2>
            </div>
            <div className="scene-block" id="final-block">
              <h1>ELITE</h1>
              <p className="sub">Eau de Parfum</p>
              <p className="taglinet">A scent beyond ordinary.</p>
              <div className="ctas">
                <button
                  className="btn hoverable"
                  onClick={() => scrollTo('#product-info')}
                >
                  <span>Discover ELITE</span>
                </button>
                <button
                  className="btn ghost hoverable"
                  onClick={() => scrollTo('#product-info')}
                >
                  <span>Explore the Notes</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div ref={scrollIndicatorRef} className="scroll-indicator">
            <span>Scroll to Experience</span>
            <div className="scroll-line">
              <i />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== EDITORIAL SECTIONS ==================== */}

      {/* Product info */}
      <section className="editorial" id="product-info">
        <div className="product-grid">
          <div className="reveal">
            <div className="product-visual">
              <div className="glow" />
              <div className="silhouette" />
            </div>
          </div>
          <div className="reveal">
            <span className="eyebrow-label">Eau de Parfum</span>
            <h2 className="product-title">ELITE</h2>
            <p className="product-sub">50 ML — Eau de Parfum</p>
            <p className="product-desc">
              A composition built on restraint. ELITE opens with bright bergamot, settles into a
              velvet iris heart, and rests on a deep, resinous oud — a fragrance that does not
              ask to be noticed. It simply is.
            </p>
            <div className="spec-list">
              <div className="spec-row">
                <span className="k">Fragrance Family</span>
                <span>Woody Amber</span>
              </div>
              <div className="spec-row">
                <span className="k">Longevity</span>
                <span>8–10 Hours</span>
              </div>
              <div className="spec-row">
                <span className="k">Concentration</span>
                <span>Eau de Parfum, 20%</span>
              </div>
              <div className="spec-row">
                <span className="k">Bottle</span>
                <span>Hand-finished, weighted glass</span>
              </div>
            </div>
            <div className="notes-cols">
              <div className="notes-col">
                <span className="tag">Top</span>
                <h3>Bergamot</h3>
              </div>
              <div className="notes-col">
                <span className="tag">Heart</span>
                <h3>Iris</h3>
              </div>
              <div className="notes-col">
                <span className="tag">Base</span>
                <h3>Oud</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="editorial" id="brand-story">
        <div className="story-wrap reveal">
          <span className="eyebrow-label">The Idea Behind ELITE</span>
          <h2>
            ELITE was created around a simple idea — that true luxury does not demand attention. It
            earns it.
          </h2>
          <h2>Every detail is designed with intention, from the first note to the final impression.</h2>
          <p className="story-credit">A digital experience by Elite Digital Solutions</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="editorial" id="final-cta">
        <div className="reveal">
          <span className="eyebrow-label">Ready When You Are</span>
          <h2>Ready to Experience ELITE?</h2>
          <div className="ctas">
            <button className="btn hoverable" onClick={() => scrollTo('#scroll-container')}>
              <span>Discover the Experience</span>
            </button>
            <button
              className="btn ghost hoverable"
              onClick={() => (window.location.href = 'mailto:studio@elitedigitalsolutions.com')}
            >
              <span>Contact Us</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-logo">ELITE</div>
            <div className="footer-credit">A digital experience by Elite Digital Solutions</div>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Navigate</h4>
              <a href="#scroll-container">Experience</a>
              <a href="#product-info">Fragrance</a>
              <a href="#brand-story">Story</a>
              <a href="#final-cta">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Follow</h4>
              <a href="#">Instagram</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Elite Digital Solutions. All rights reserved.</span>
          <span>Crafted as a demonstration of cinematic digital experience.</span>
        </div>
      </footer>
    </>
  );
}
