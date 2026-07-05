/* ==========================================================================
   Tomasz Brzoza — IBM Planning Analytics / TM1 Architect
   Vanilla JS + GSAP/ScrollTrigger + Lenis (all optional-safe: the page
   stays fully usable if a CDN is blocked).
   ========================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePtr  = window.matchMedia('(pointer: fine)').matches;
  const hasGsap  = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ========================================================================
     Language — each language lives on its own URL (/ = EN, /de/ = DE)
     ======================================================================== */
  const PAGE_LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
  const STRINGS = PAGE_LANG === 'de'
    ? { copied: 'E-Mail-Adresse kopiert', menuOpen: 'Menü öffnen', menuClose: 'Menü schließen' }
    : { copied: 'Email copied to clipboard', menuOpen: 'Open menu', menuClose: 'Close menu' };

  // First-time visitors with a German browser get the German version;
  // an explicit choice (lang switcher link) always wins and is remembered
  if (PAGE_LANG === 'en') {
    let storedLang = null;
    try { storedLang = localStorage.getItem('tb-lang'); } catch (e) { /* storage blocked */ }
    if (!storedLang) {
      const preferred = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
      // explicit file name so it also works when opened from disk (file://)
      if (preferred.startsWith('de')) location.replace('de/index.html');
    }
  }
  $$('.lang-link').forEach(a => {
    a.addEventListener('click', () => {
      try { localStorage.setItem('tb-lang', a.dataset.lang); } catch (e) { /* storage blocked */ }
    });
  });

  /* Word-split helper: wraps each word in .w > .wi for masked reveals */
  function splitWords(el) {
    const text = el.textContent;
    el.textContent = '';
    text.split(' ').forEach((word, i, arr) => {
      const w = document.createElement('span');
      w.className = 'w';
      const wi = document.createElement('span');
      wi.className = 'wi';
      wi.textContent = word;
      if (hasGsap && !reduced) gsap.set(wi, { yPercent: 120 });
      w.appendChild(wi);
      el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('.split').forEach(el => splitWords(el));

  /* ========================================================================
     Basic interactions (work without GSAP)
     ======================================================================== */

  // Footer year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Services accordion — one open at a time
  $$('.svc').forEach(item => {
    const head = $('.svc-head', item);
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      $$('.svc.is-open').forEach(other => {
        other.classList.remove('is-open');
        $('.svc-head', other).setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
        // Lazy-inject the service image (shown on the right of the expanded body)
        if (item.dataset.img && !$('.svc-img', item)) {
          const img = document.createElement('img');
          img.src = item.dataset.img;
          img.alt = '';
          img.className = 'svc-img';
          img.loading = 'lazy';
          img.decoding = 'async';
          $('.svc-body-inner', item).appendChild(img);
        }
      }
    });
  });


  // Copy email
  const toast = $('#toast');
  let toastTimer;
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast.textContent = STRINGS.copied;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
      } catch (e) { /* clipboard unavailable — mailto link still works */ }
    });
  });

  // Mobile menu
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  function closeMenu() {
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', STRINGS.menuOpen);
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    if (open) { closeMenu(); return; }
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', STRINGS.menuClose);
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
  });
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));

  /* ========================================================================
     Lenis smooth scroll
     ======================================================================== */
  let lenis = null;
  if (hasLenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    window.lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else {
    // No Lenis: enable native CSS smooth scrolling as fallback
    document.documentElement.classList.add('no-lenis');
  }

  // Anchor navigation (Lenis-aware, with header offset)
  function scrollToTarget(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    // force: run even if Lenis is stopped/locked; lock: ignore stray wheel
    // momentum during the animation, otherwise it cancels the navigation.
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4, force: true, lock: true });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) {
        e.preventDefault();
        scrollToTarget(id);
        history.replaceState(null, '', id);
      }
    });
  });
  $('#toTop').addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.4, force: true, lock: true });
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  // Header scrolled state
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ========================================================================
     Magnetic buttons (desktop, motion allowed)
     ======================================================================== */
  if (finePtr && !reduced) {
    if (hasGsap) {
      $$('.btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - r.left - r.width / 2) * 0.25,
            y: (e.clientY - r.top - r.height / 2) * 0.35,
            duration: 0.4, ease: 'power3.out'
          });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        });
      });
    }
  }

  /* ========================================================================
     Preloader + intro + scroll animations
     ======================================================================== */
  const preloader = $('#preloader');

  function killPreloaderInstantly() {
    if (preloader) preloader.style.display = 'none';
    if (hasGsap) {
      // Make sure nothing stays hidden
      gsap.set('.split .wi', { yPercent: 0 });
    }
  }

  // Play the full preloader intro only once per session — repeat views get
  // instant content (better LCP / Core Web Vitals)
  let revisit = false;
  try {
    revisit = sessionStorage.getItem('tb-seen') === '1';
    sessionStorage.setItem('tb-seen', '1');
  } catch (e) { /* storage unavailable — treat as first visit */ }

  if (!hasGsap || reduced || revisit) {
    // No animation stack (or repeat view): show everything immediately
    killPreloaderInstantly();
  } else {
    // Preloader plays: always start the experience from the top
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });

    // Lock scrolling during the intro (Lenis-aware)
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';

    const counter = { v: 0 };
    const countEl = $('#preCount');
    const introTl = gsap.timeline({
      onComplete: () => {
        if (lenis) lenis.start(); else document.body.style.overflow = '';
        ScrollTrigger.refresh();
      }
    });

    introTl
      .to(counter, {
        v: 100, duration: 1.1, ease: 'power2.inOut',
        onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(2, '0'); }
      })
      .to(preloader, {
        yPercent: -100, duration: 0.9, ease: 'power4.inOut',
        onComplete: () => { preloader.style.display = 'none'; }
      }, '+=0.15')
      // Hero intro
      .to('.hero-title .wi', { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09 }, '-=0.45')
      .from('.hero-eyebrow', { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out' }, '-=0.9')
      .from('.hero-sub', { y: 30, autoAlpha: 0, duration: 0.8, ease: 'power3.out' }, '-=0.75')
      .from('.hero-ctas .btn', { y: 26, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.6')
      .from('.hero-avail', { autoAlpha: 0, duration: 0.6 }, '-=0.4')
      .from('.dim-label', { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.07 }, '-=0.7')
      .from('.hero-bg', { autoAlpha: 0, duration: 1.6, ease: 'power2.out' }, '-=1.4')
      .from('.hero-foot', { autoAlpha: 0, duration: 0.6 }, '-=0.4');
  }

  /* ========================================================================
     Scroll-driven animations — run on every visit (with GSAP, motion allowed)
     ======================================================================== */
  if (hasGsap && !reduced) {
    /* ----- Hero backdrop: slow drift + scroll parallax ----- */
    gsap.to('.hero-bg img', {
      scale: 1.07, xPercent: -1.5,
      duration: 20, yoyo: true, repeat: -1, ease: 'sine.inOut'
    });
    gsap.to('.hero-bg img', {
      yPercent: 12,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    /* ----- Hero visual (dimension labels) scroll parallax ----- */
    gsap.to('.hero-visual', {
      y: 90,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    // Floating dimension labels
    $$('.dim-label').forEach((label, i) => {
      gsap.to(label, {
        y: i % 2 ? 12 : -12,
        duration: 2.6 + i * 0.4,
        repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
    });

    /* ----- Generic reveals ----- */
    $$('[data-reveal]').forEach(el => {
      gsap.from(el, {
        y: 44, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* ----- Image reveals: clip-path wipe + inner de-zoom ----- */
    $$('.img-reveal').forEach(frame => {
      const img = $('img', frame);
      gsap.set(frame, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(img, { scale: 1.25 });
      ScrollTrigger.create({
        trigger: frame, start: 'top 82%', once: true,
        onEnter: () => {
          gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut' });
          gsap.to(img, { scale: 1, duration: 1.8, ease: 'power3.out' });
        }
      });
    });

    /* ----- Quote backdrop parallax ----- */
    gsap.fromTo('.quote-bg img', { yPercent: -9 }, {
      yPercent: 9, ease: 'none',
      scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: 1 }
    });

    /* ----- Approach cards entrance ----- */
    gsap.from('.apr-card', {
      y: 70, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.apr-wrap', start: 'top 85%', once: true }
    });

    /* ----- Toolbox chips stagger ----- */
    gsap.from('.chip', {
      y: 22, autoAlpha: 0, duration: 0.6, ease: 'power2.out', stagger: 0.045,
      scrollTrigger: { trigger: '.chips', start: 'top 90%', once: true }
    });

    /* ----- Giant footer wordmark: rise + lateral drift ----- */
    gsap.fromTo('.footer-word',
      { yPercent: 55, xPercent: 3, autoAlpha: 0 },
      {
        yPercent: 0, xPercent: -3, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: '.footer-word-wrap', start: 'top 98%', end: 'bottom 65%', scrub: 1 }
      });

    /* ----- Stats count-up ----- */
    $$('.count').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.v); }
        })
      });
    });

    /* ----- Approach: pinned horizontal scroll (desktop only) ----- */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', () => {
      const track = $('#aprTrack');
      const wrap = $('.apr-wrap');
      const amt = () => Math.max(0, track.scrollWidth - wrap.clientWidth + parseFloat(getComputedStyle(wrap).paddingLeft) * 2);
      const tween = gsap.to(track, {
        x: () => -amt(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.approach',
          start: 'top 12%',
          end: () => '+=' + (amt() + 200),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
      return () => { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
    });

    /* ----- Quote: gradient text fill on scrub ----- */
    gsap.to('.quote-text', {
      backgroundPosition: '0% 0',
      ease: 'none',
      scrollTrigger: { trigger: '.quote', start: 'top 78%', end: 'center 42%', scrub: 1 }
    });

    /* ----- Contact headline mask reveal ----- */
    ScrollTrigger.create({
      trigger: '.contact-title', start: 'top 85%', once: true,
      onEnter: () => gsap.to('.contact-title .wi', {
        yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.1
      })
    });

    /* ----- Active nav link ----- */
    ['about', 'services', 'approach', 'contact'].forEach(id => {
      ScrollTrigger.create({
        trigger: '#' + id,
        start: 'top center',
        end: 'bottom center',
        onToggle: self => {
          $$('.main-nav a').forEach(a => {
            a.classList.toggle('is-active', self.isActive && a.getAttribute('href') === '#' + id);
          });
        }
      });
    });
  }
})();
