(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (reduce || typeof gsap === 'undefined') return;

  /* ---------- DOM FX layer ---------- */
  const wipe = document.createElement('div');
  wipe.className = 'page-wipe';
  wipe.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(wipe);

  const fx = document.createElement('div');
  fx.className = 'fx-layer';
  fx.id = 'fxLayer';
  document.body.appendChild(fx);

  const intro = document.createElement('div');
  intro.className = 'intro is-on';
  intro.innerHTML = `
    <div class="intro-panels">
      <div class="intro-panel p1"></div>
      <div class="intro-panel p2"></div>
      <div class="intro-panel p3"></div>
    </div>
    <div class="intro-word" id="introWord"></div>`;
  document.body.appendChild(intro);

  const word = intro.querySelector('#introWord');
  'ESAMAÏ'.split('').forEach((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    word.appendChild(s);
  });

  /* ---------- Intro cinematic ---------- */
  const introTl = gsap.timeline({ defaults: { ease: 'power4.inOut' } });
  introTl
    .from('#introWord span', {
      yPercent: 140, rotate: 18, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'back.out(1.8)'
    })
    .to('#introWord span', {
      y: -8, duration: 0.35, yoyo: true, repeat: 1, stagger: 0.04, ease: 'sine.inOut'
    }, '-=0.1')
    .to('#introWord', { scale: 1.12, duration: 0.25, ease: 'power2.in' }, '-=0.1')
    .to('#introWord', { scale: 18, opacity: 0, duration: 0.55, ease: 'power3.in' })
    .to('.intro-panel', { yPercent: -110, duration: 0.7, stagger: 0.08, ease: 'power4.in' }, '-=0.35')
    .set(intro, { display: 'none' });

  /* ---------- Cursor trail ---------- */
  if (!isTouch) {
    const dots = Array.from({ length: 10 }, (_, i) => {
      const d = document.createElement('div');
      d.className = 'cursor-dot';
      d.style.width = d.style.height = `${Math.max(4, 12 - i)}px`;
      document.body.appendChild(d);
      return { el: d, x: 0, y: 0 };
    });
    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function trail() {
      let x = mx, y = my;
      dots.forEach((d, i) => {
        d.x += (x - d.x) * (0.22 - i * 0.012);
        d.y += (y - d.y) * (0.22 - i * 0.012);
        d.el.style.transform = `translate(${d.x}px, ${d.y}px) translate(-50%,-50%)`;
        x = d.x; y = d.y;
      });
      requestAnimationFrame(trail);
    })();
  }

  /* ---------- Hero brand split + floating food ---------- */
  const brand = document.getElementById('heroBrand');
  if (brand && !brand.querySelector('.ch')) {
    const text = brand.textContent;
    brand.textContent = '';
    text.split('').forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch === ' ' ? '\u00a0' : ch;
      brand.appendChild(s);
    });
    gsap.from('#heroBrand .ch', {
      yPercent: 120, rotateX: 80, opacity: 0, duration: 0.8, stagger: 0.06,
      ease: 'back.out(1.7)', delay: 1.6
    });
    gsap.to('#heroBrand .ch', {
      y: -6, duration: 1.6, stagger: 0.08, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.6
    });
  }

  const hero = document.querySelector('.hero');
  if (hero && !hero.querySelector('.hero-bits')) {
    const bits = document.createElement('div');
    bits.className = 'hero-bits';
    const emojis = ['🍔', '🍟', '🧀', '🌶️', '🥬', '🍅', '🔥'];
    emojis.forEach((e, i) => {
      const b = document.createElement('span');
      b.className = 'hero-bit';
      b.textContent = e;
      b.style.left = `${8 + (i * 13) % 84}%`;
      b.style.top = `${12 + (i * 17) % 70}%`;
      b.style.animationDelay = `${i * 0.35}s`;
      b.style.fontSize = `${22 + (i % 3) * 8}px`;
      bits.appendChild(b);
    });
    hero.appendChild(bits);
  }

  const glows = document.querySelectorAll('.glow');
  if (glows.length) {
    gsap.to('.glow-1', { x: 40, y: 30, duration: 5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.glow-2', { x: -30, y: -24, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  /* ---------- Add-to-cart burst ---------- */
  const foods = ['🍔', '🔥', '🧀', '🍟', '✨'];
  function burst(x, y) {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('span');
      el.className = 'fx-burst';
      el.textContent = foods[i % foods.length];
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      fx.appendChild(el);
      const dx = (Math.random() - 0.5) * 160;
      const dy = -80 - Math.random() * 120;
      gsap.to(el, {
        x: dx, y: dy, rotation: (Math.random() - 0.5) * 220,
        opacity: 0, scale: 0.4, duration: 0.85 + Math.random() * 0.35,
        ease: 'power2.out',
        onComplete: () => el.remove()
      });
    }
  }

  document.addEventListener('esamai:add', (e) => {
    const btn = e.detail?.btn;
    const r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    burst(r.left + r.width / 2, r.top + r.height / 2);
    const panel = document.getElementById('cartPanel');
    if (panel) gsap.fromTo(panel, { scale: 1 }, { scale: 1.03, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
  });

  /* goTo already wired in main.js */

  /* ---------- Tilt on product cards ---------- */
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.fav-card, .highlight-card, .feature-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card, { rotateY: px * 10, rotateX: -py * 8, duration: 0.25, transformPerspective: 700, ease: 'power2.out' });
  }, { passive: true });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.fav-card, .highlight-card, .feature-card');
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.45, ease: 'power3.out' });
  });
})();
