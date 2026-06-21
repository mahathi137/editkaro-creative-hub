/* ===================================================================
   EDITKARO.IN — APPLICATION SCRIPT
   Vanilla JS. No dependencies. Organised by feature module.
=================================================================== */
(function () {
  'use strict';

  /* =================== UTILITIES =================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =================== 1. PRELOADER =================== */
  function initPreloader() {
    const preloader = $('#preloader');
    const fill = $('#preloaderFill');
    const percentEl = $('#preloaderPercent');
    if (!preloader) return;

    let progress = 0;
    const tick = () => {
      // Ease toward 90% while waiting for window load, then snap to 100%.
      progress += (90 - progress) * 0.06 + 0.4;
      progress = clamp(progress, 0, 90);
      fill.style.width = progress + '%';
      percentEl.textContent = String(Math.floor(progress)).padStart(3, '0');
      if (progress < 90) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const finish = () => {
      fill.style.width = '100%';
      percentEl.textContent = '100';
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.remove('lock-scroll');
      }, 350);
    };

    document.body.classList.add('lock-scroll');
    if (document.readyState === 'complete') {
      setTimeout(finish, 500);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 400));
      // Safety net so the site never stays stuck behind the preloader.
      setTimeout(finish, 4000);
    }
  }

  /* =================== 2. CUSTOM CURSOR =================== */
  function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('[data-cursor-hover], a, button, input, textarea, select')) {
        ring.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-cursor-hover], a, button, input, textarea, select')) {
        ring.classList.remove('hovering');
      }
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
  }

  /* =================== 3. SCROLL TIMELINE + TIMECODES (signature element) =================== */
  function formatTimecode(percent) {
    // Maps 0–100% of page scroll to an editor-style HH:MM:SS:FF readout.
    const totalFrames = Math.round((percent / 100) * (59 * 60 * 24)); // ~59 min runway at 24fps
    const fps = 24;
    const totalSeconds = Math.floor(totalFrames / fps);
    const frames = totalFrames % fps;
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(frames)}`;
  }

  function initScrollTimeline() {
    const fill = $('#timelineFill');
    const playhead = $('#timelinePlayhead');
    const bar = $('#timelineBar');
    const navTc = $('#navTimecode');
    const heroTc = $('#heroTimecode');
    const navbar = $('#navbar');
    const backToTop = $('#backToTop');

    let ticking = false;
    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? clamp((scrollTop / docHeight) * 100, 0, 100) : 0;

      if (fill) fill.style.width = percent + '%';
      if (playhead) playhead.style.left = percent + '%';
      if (bar) bar.setAttribute('aria-valuenow', String(Math.round(percent)));

      const code = formatTimecode(percent);
      if (navTc) navTc.textContent = code;
      if (heroTc) heroTc.textContent = code;

      if (navbar) navbar.classList.toggle('scrolled', scrollTop > 30);
      if (backToTop) backToTop.hidden = scrollTop < 600;

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* =================== 4. NAVIGATION (mobile menu, active link, smooth scroll) =================== */
  function initNav() {
    const burger = $('#navBurger');
    const navLinks = $('#navLinks');
    const links = $$('[data-nav]');

    if (burger && navLinks) {
      burger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(isOpen));
        burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('lock-scroll', isOpen);
      });
      links.forEach((link) => link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('lock-scroll');
      }));
    }

    const sections = links
      .map((l) => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = '#' + entry.target.id;
            links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === id));
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach((s) => observer.observe(s));
    }
  }

  /* =================== 5. THEME SWITCHER =================== */
  function initTheme() {
    const toggle = $('#themeToggle');
    const root = document.documentElement;
    const STORAGE_KEY = 'editkaro-theme';

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }

    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = saved || (prefersLight ? 'light' : 'dark');
    root.setAttribute('data-theme', initial);
    if (toggle) toggle.setAttribute('aria-pressed', String(initial === 'light'));

    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = root.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        toggle.setAttribute('aria-pressed', String(next === 'light'));
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* storage unavailable */ }
      });
    }
  }

  /* =================== 6. SCROLL REVEAL =================== */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach((el) => observer.observe(el));
  }

  /* =================== 7. ANIMATED COUNTERS =================== */
  function initCounters() {
    const counters = $$('.stat-number');
    if (!counters.length) return;

    function animateCounter(el) {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();

      function frame(now) {
        const elapsed = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
        const value = target * eased;
        el.textContent = (decimals ? value.toFixed(decimals) : Math.floor(value).toLocaleString('en-IN')) + suffix;
        if (elapsed < 1) requestAnimationFrame(frame);
        else el.textContent = (decimals ? target.toFixed(decimals) : target.toLocaleString('en-IN')) + suffix;
      }
      requestAnimationFrame(frame);
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => observer.observe(el));
  }

  /* =================== 8. PORTFOLIO DATA =================== */
  const PORTFOLIO_DATA = [
    { id: 1, title: 'Midnight Sneaker Drop', client: 'Loomwear', category: 'Short Form', metric: '6.1M views', tc: '00:00:09', grad: 'linear-gradient(135deg,#FF4D2E,#7A1FFF)', video: 'short-form-midnight-drop.mp4', description: 'A nine-second hook engineered for the first frame, cut for the Reels algorithm and re-versioned across three aspect ratios.' },
    { id: 2, title: 'Creator Desk Setup Reel', client: 'TechNeha', category: 'Short Form', metric: '2.8M views', tc: '00:00:12', grad: 'linear-gradient(135deg,#3DEEFF,#1F5DFF)', video: 'short-form-desk-setup-ep4.mp4', description: 'Fast-paced product-reveal cutting with synced SFX hits on every transition to hold attention past the three-second mark.' },
    { id: 3, title: 'The Last Harvest: Documentary Cut', client: 'Frame & Field Films', category: 'Long Form', metric: '38 min runtime', tc: '00:02:55', grad: 'linear-gradient(135deg,#1c3b2e,#0c1b22)', video: 'longform-last-harvest.mp4', description: 'Three-act narrative restructure of 40 hours of field footage into a single 38-minute broadcast cut.' },
    { id: 4, title: 'Founder Journey: Episode 1', client: 'StreetEats Co.', category: 'Long Form', metric: '410K watch-hrs', tc: '00:00:30', grad: 'linear-gradient(135deg,#FF8A3D,#FF4D2E)', video: 'longform-founder-story-ep1.mp4', description: 'Interview-led long form with B-roll pacing designed to keep average view duration above 60%.' },
    { id: 5, title: 'Valorant Clutch Montage', client: 'NightOwl Gaming', category: 'Gaming', metric: '1.4M views', tc: '00:00:13', grad: 'linear-gradient(135deg,#7A1FFF,#1F5DFF)', video: 'gaming-clutch-round-valorant.mp4', description: 'Frame-accurate killcam sequencing with beat-synced callouts built for the highlight-reel format.' },
    { id: 6, title: 'Epic Boss Battle Compilation', client: 'PixelForge Studios', category: 'Gaming', metric: '920K views', tc: '00:00:28', grad: 'linear-gradient(135deg,#3DEEFF,#7A1FFF)', video: 'gaming-boss-rush-compilation.mp4', description: 'Multi-clip boss-fight montage cut on rhythm, with motion-tracked UI overlays for damage callouts.' },
    { id: 7, title: 'Derby Day Match Highlights', client: 'Coastal United FC', category: 'Football', metric: '3.2M views', tc: '00:00:09', grad: 'linear-gradient(135deg,#3DFF8F,#0C8F4A)', video: 'football-derby-day-highlights.mp4', description: 'Same-day match highlight package, scripted goal-by-goal and exported within sixty minutes of full time.' },
    { id: 8, title: 'Tactical Press Breakdown', client: 'Coastal United FC', category: 'Football', metric: '540K views', tc: '00:00:10', grad: 'linear-gradient(135deg,#0C8F4A,#0B0B0F)', video: 'football-tactical-breakdown.mp4', description: 'Analyst-style tactical cut-up with telestration overlays explaining the team\'s press triggers.' },
    { id: 9, title: 'Loom Jacket Product Film', client: 'Loomwear', category: 'eCommerce', metric: '4.7x ROAS', tc: '00:00:32', grad: 'linear-gradient(135deg,#FF4D2E,#FF8A3D)', video: 'ecommerce-loom-jacket.mp4', description: 'Conversion-first product film paired with UGC inserts, optimised for paid feed placement.' },
    { id: 10, title: 'iPhone Studio Kit Unboxing Ad', client: 'CrateBox', category: 'eCommerce', metric: '3.1x ROAS', tc: '00:00:11', grad: 'linear-gradient(135deg,#3DEEFF,#3DFF8F)', video: 'ecommerce-unboxing-studio-kit.mp4', description: 'Crisp, ASMR-leaning unboxing edit timed to a custom sound design pass for sound-on placements.' },
    { id: 11, title: 'Riverline: Feature Documentary', client: 'Frame & Field Films', category: 'Documentary', metric: 'Festival selection', tc: '00:00:32', grad: 'linear-gradient(135deg,#1c2233,#0c1b22)', video: 'documentary-riverline.mp4', description: 'Feature-length conservation documentary, structured around a three-act arc with archival inter-cuts.' },
    { id: 12, title: 'Voices of the Pottery Workshop', client: 'Maker\'s Guild', category: 'Documentary', metric: '22 min runtime', tc: '00:00:18', grad: 'linear-gradient(135deg,#FF8A3D,#7A1FFF)', video: 'documentary-voices-of-the-workshop.mp4', description: 'Observational craft documentary with a patient pace and minimal-intervention sound design.' },
    { id: 13, title: 'Desert Tones: Cinematic Grade', client: 'Loomwear', category: 'Color Grading', metric: 'Full LUT pack', tc: '00:00:17', grad: 'linear-gradient(135deg,#FF7A3D,#5A2A1C)', video: 'colorgrade-desert-tones.mp4', description: 'Custom LUT development and shot-matching pass across a six-location commercial shoot.' },
    { id: 14, title: 'Night Drive: Color Grading Showcase', client: 'CrateBox', category: 'Color Grading', metric: 'Day-for-night pass', tc: '00:00:14', grad: 'linear-gradient(135deg,#1F5DFF,#0B0B0F)', video: 'colorgrade-night-drive.mp4', description: 'Teal-leaning night grade built to hold skin tones while pushing contrast for a cinematic mood.' },
    { id: 15, title: 'Frostbound AMV', client: 'FrameSync Edits', category: 'Anime', metric: '1.1M views', tc: '00:00:19', grad: 'linear-gradient(135deg,#3DEEFF,#FF4D2E)', video: 'anime-frostbound-amv.mp4', description: 'Beat-locked AMV cut frame-by-frame to a custom audio edit, with motion-blur smoothing on every transition.' },
    { id: 16, title: 'Ronin: Fight Sync Edit', client: 'FrameSync Edits', category: 'Anime', metric: '780K views', tc: '00:00:19', grad: 'linear-gradient(135deg,#7A1FFF,#FF4D2E)', video: 'anime-ronin-fight-sync.mp4', description: 'Combat-sequence AMV with impact-frame timing matched to percussive hits in the score.' },
    { id: 17, title: 'Brand Launch TV Commercial', client: 'StreetEats Co.', category: 'Advertisement', metric: 'National broadcast', tc: '00:00:26', grad: 'linear-gradient(135deg,#FF4D2E,#3DEEFF)', video: 'advertisement-launch-spot-tvc.mp4', description: 'Broadcast-ready 30-second spot, concepted, storyboarded, shot-list assisted, and finished in-house.' },
    { id: 18, title: 'App Launch Performance Campaign', client: 'CrateBox', category: 'Advertisement', metric: '2.9% CTR', tc: '00:00:31', grad: 'linear-gradient(135deg,#3DFF8F,#3DEEFF)', video: 'advertisement-app-launch-performance.mp4', description: 'Direct-response performance ad with a hook-led structure tested across four opening variants.' }
  ];

  /* =================== 9. PORTFOLIO RENDER + FILTER + SEARCH =================== */
  function initPortfolio() {
    const grid = $('#portfolioGrid');
    const emptyState = $('#portfolioEmpty');
    const searchInput = $('#portfolioSearch');
    const filterBar = $('#portfolioFilters');
    if (!grid) return;

    let activeFilter = 'all';
    let query = '';

    function buildCard(item) {
      const card = document.createElement('article');
      card.className = 'portfolio-card';
      card.dataset.category = item.category;
      card.dataset.id = item.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Open ${item.title} preview`);

      card.innerHTML = `
        <div class="card-thumb">
          <video class="card-video" muted playsinline preload="metadata" loop src="assets/videos/${item.video}" aria-label="${item.title} preview"></video>
          <div class="card-overlay">
            <div class="card-top-row">
              <span class="card-cat">${item.category}</span>
              <span class="card-tc">${item.tc}</span>
            </div>
            <span class="card-play"><svg class="icon"><use href="#icon-play"/></svg></span>
            <div class="card-bottom">
              <h3>${item.title}</h3>
              <span>${item.client} &middot; ${item.metric}</span>
            </div>
          </div>
        </div>`;

      const video = card.querySelector('.card-video');
      if (video) {
        const playPreview = () => {
          video.play().catch(() => {});
        };
        const pausePreview = () => {
          video.pause();
        };
        card.addEventListener('pointerenter', playPreview);
        card.addEventListener('pointerleave', pausePreview);
        card.addEventListener('focus', playPreview);
        card.addEventListener('blur', pausePreview);
        card.addEventListener('touchstart', playPreview, { passive: true });
        card.addEventListener('touchend', pausePreview);
        card.addEventListener('touchcancel', pausePreview);
      }

      card.addEventListener('click', () => openModal(item));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item); }
      });
      return card;
    }

    function render() {
      grid.innerHTML = '';
      const filtered = PORTFOLIO_DATA.filter((item) => {
        const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
        const haystack = (item.title + ' ' + item.client + ' ' + item.category).toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      });

      if (!filtered.length) {
        emptyState.hidden = false;
      } else {
        emptyState.hidden = true;
        const frag = document.createDocumentFragment();
        filtered.forEach((item, i) => {
          const card = buildCard(item);
          card.style.animationDelay = (i * 0.04) + 's';
          frag.appendChild(card);
        });
        grid.appendChild(frag);
      }
    }

    function lazyLoadThumbnails() {
      const thumbs = $$('.card-thumb', grid);
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '200px' });
      thumbs.forEach((t) => observer.observe(t));
    }

    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        $$('.filter-btn', filterBar).forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        activeFilter = btn.dataset.filter;
        render();
      });
    }

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { query = e.target.value.trim(); render(); }, 180);
      });
    }

    render();
  }

  /* =================== 10. VIDEO MODAL =================== */
  let lastFocusedEl = null;

  function openModal(item) {
    const modal = $('#videoModal');
    const video = $('#modalVideo');
    const fallback = $('#modalFallback');
    const category = $('#modalCategory');
    const title = $('#modalTitle');
    const description = $('#modalDescription');
    const metrics = $('#modalMetrics');
    if (!modal) return;

    category.textContent = item.category;
    title.textContent = item.title;
    description.textContent = item.description;
    metrics.innerHTML = `
      <div class="metric"><span class="metric-number">${item.metric}</span><span class="metric-label">Result</span></div>
      <div class="metric"><span class="metric-number">${item.client}</span><span class="metric-label">Client</span></div>
      <div class="metric"><span class="metric-number">${item.tc}</span><span class="metric-label">Timecode</span></div>`;

    fallback.querySelector('code') && (fallback.querySelector('code').textContent = `assets/videos/${item.video}`);

    video.pause();
    video.removeAttribute('src');
    video.style.display = 'none';
    fallback.style.display = 'flex';
    video.src = `assets/videos/${item.video}`;
    video.onloadeddata = () => {
      video.style.display = 'block';
      fallback.style.display = 'none';
    };
    video.onerror = () => { video.style.display = 'none'; fallback.style.display = 'flex'; };
    video.load();

    lastFocusedEl = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('lock-scroll');
    requestAnimationFrame(() => $('#modalClose').focus());
  }

  function closeModal() {
    const modal = $('#videoModal');
    const video = $('#modalVideo');
    if (!modal || modal.hidden) return;
    video.pause();
    modal.hidden = true;
    document.body.classList.remove('lock-scroll');
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  function initModal() {
    const modal = $('#videoModal');
    const closeBtn = $('#modalClose');
    const backdrop = $('#modalBackdrop');
    if (!modal) return;

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    const featuredFrame = $('.featured-frame');
    if (featuredFrame) {
      featuredFrame.addEventListener('click', () => openModal({
        title: 'StreetEats: From Local Stall to Local Favorite',
        category: 'Case Study',
        client: 'StreetEats Co.',
        metric: '9.4M views',
        tc: '00:00:16',
        video: 'case-study-streeteats-sprint-reel.mp4',
        description: 'A compilation reel of the short-form sprint that took StreetEats Co. from a single stall to a city-wide queue in six weeks.'
      }));

      const featuredVideo = $('#featuredVideo');
      if (featuredVideo) {
        const featuredPlay = () => { featuredVideo.play().catch(() => {}); };
        const featuredPause = () => { featuredVideo.pause(); };
        featuredFrame.addEventListener('pointerenter', featuredPlay);
        featuredFrame.addEventListener('pointerleave', featuredPause);
        featuredFrame.addEventListener('focus', featuredPlay);
        featuredFrame.addEventListener('blur', featuredPause);
      }
    }
  }

  /* =================== 11. BEFORE / AFTER SLIDER =================== */
  function initCompareSlider() {
    const widget = $('#compareWidget');
    const before = $('#compareBefore');
    const handle = $('#compareHandle');
    const rawVideo = $('#rawCompareVideo');
    const editedVideo = $('#editedCompareVideo');
    const badges = $$('.compare-badge');
    if (!widget || !before || !handle || !rawVideo || !editedVideo) return;

    let dragging = false;
    let syncing = false;
    let lastSyncSource = null;

    function setPosition(percent) {
      const p = clamp(percent, 0, 100);
      before.style.width = p + '%';
      handle.style.left = p + '%';
      handle.setAttribute('aria-valuenow', String(Math.round(p)));
    }

    function positionFromEvent(clientX) {
      const rect = widget.getBoundingClientRect();
      setPosition(((clientX - rect.left) / rect.width) * 100);
    }

    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    widget.addEventListener('pointerdown', (e) => {
      if (e.target === handle || handle.contains(e.target)) return;
      positionFromEvent(e.clientX);
      dragging = true;
    });

    window.addEventListener('pointermove', (e) => {
      if (dragging) positionFromEvent(e.clientX);
    });

    window.addEventListener('pointerup', () => {
      dragging = false;
    });

    handle.addEventListener('keydown', (e) => {
      const current = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft') { setPosition(current - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPosition(current + 5); e.preventDefault(); }
    });

    function syncVideo(source, target) {
      if (syncing || !source || !target) return;
      syncing = true;
      lastSyncSource = source;
      if (Math.abs(source.currentTime - target.currentTime) > 0.15) {
        target.currentTime = source.currentTime;
      }
      if (!source.paused && target.paused) {
        target.play().catch(() => {});
      }
      if (source.paused && !target.paused) {
        target.pause();
      }
      syncing = false;
    }

    function attachSync(source, target) {
      source.addEventListener('play', () => syncVideo(source, target));
      source.addEventListener('pause', () => syncVideo(source, target));
      source.addEventListener('seeking', () => syncVideo(source, target));
      source.addEventListener('timeupdate', () => {
        if (syncing || lastSyncSource !== source) return;
        if (Math.abs(source.currentTime - target.currentTime) > 0.2) {
          target.currentTime = source.currentTime;
        }
      });
    }

    [rawVideo, editedVideo].forEach((video) => {
      video.muted = true;
      video.loop = true;
      video.preload = 'metadata';
      video.setAttribute('playsinline', '');
      attachSync(video === rawVideo ? rawVideo : editedVideo, video === rawVideo ? editedVideo : rawVideo);
    });

    widget.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      if (rawVideo.paused && editedVideo.paused) {
        rawVideo.play().catch(() => {});
        editedVideo.play().catch(() => {});
      }
    });

    if ('IntersectionObserver' in window) {
      const badgeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          badges.forEach((badge) => {
            badge.style.transitionDelay = `${(Number(badge.dataset.delay) || 0) * 80}ms`;
            badge.classList.add('visible');
          });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.22 });
      badgeObserver.observe(widget);
    } else {
      badges.forEach((badge) => badge.classList.add('visible'));
    }

    setPosition(50);
  }

  /* =================== 12. TESTIMONIAL CAROUSEL =================== */
  function initTestimonials() {
    const track = $('#testimonialTrack');
    const cards = $$('.testimonial-card', track || undefined);
    const prevBtn = $('#testimonialPrev');
    const nextBtn = $('#testimonialNext');
    const dotsWrap = $('#testimonialDots');
    if (!track || !cards.length) return;

    let index = 0;
    let timer = null;
    const AUTOPLAY_MS = 6000;

    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = $$('button', dotsWrap);

    function goTo(i) {
      index = (i + cards.length) % cards.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('active', di === index));
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (!prefersReducedMotion) timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
    }

    prevBtn && prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(index + 1));

    track.parentElement.addEventListener('mouseenter', () => clearInterval(timer));
    track.parentElement.addEventListener('mouseleave', restart);

    goTo(0);
  }

  /* =================== 13. CONTACT FORM VALIDATION =================== */
  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;
    const success = $('#formSuccess');
    const submitBtn = $('#contactSubmit');

    const validators = {
      name: (v) => v.trim().length >= 2 || 'Enter your full name.',
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
      phone: (v) => /^[0-9+\-\s()]{7,16}$/.test(v.trim()) || 'Enter a valid phone number.',
      service: (v) => v.trim().length > 0 || 'Select a service.',
      message: (v) => v.trim().length >= 10 || 'Tell us a little more (10+ characters).'
    };

    function showError(field, message) {
      const wrap = $(`#cf-${field}`).closest('.form-field');
      const errEl = $(`#err-${field}`);
      if (message) { wrap.classList.add('invalid'); errEl.textContent = message; }
      else { wrap.classList.remove('invalid'); errEl.textContent = ''; }
    }

    function validateField(field) {
      const el = $(`#cf-${field}`);
      const result = validators[field](el.value);
      showError(field, result === true ? '' : result);
      return result === true;
    }

    Object.keys(validators).forEach((field) => {
      const el = $(`#cf-${field}`);
      if (el) el.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = Object.keys(validators);
      const results = fields.map(validateField);
      const allValid = results.every(Boolean);

      if (!allValid) {
        const firstInvalid = form.querySelector('.form-field.invalid input, .form-field.invalid select, .form-field.invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      // No backend by design (client-side only project) — simulate the network round trip.
      setTimeout(() => {
        form.reset();
        fields.forEach((f) => showError(f, ''));
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Brief <svg class="icon icon-sm"><use href="#icon-arrow"/></svg>';
        success.hidden = false;
        success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
        setTimeout(() => { success.hidden = true; }, 6000);
      }, 900);
    });
  }

  /* =================== 14. FAB MENU =================== */
  function initFab() {
    const fab = $('#fabBtn');
    const menu = $('#fabMenu');
    if (!fab || !menu) return;

    fab.addEventListener('click', () => {
      const isOpen = menu.hidden === false;
      menu.hidden = isOpen;
      fab.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== fab) {
        menu.hidden = true;
        fab.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* =================== 15. BACK TO TOP =================== */
  function initBackToTop() {
    const btn = $('#backToTop');
    if (!btn) return;
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* =================== 16. MISC =================== */
  function initMisc() {
    const yearEl = $('#footerYear');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* =================== INIT =================== */
  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initCursor();
    initScrollTimeline();
    initNav();
    initTheme();
    initReveal();
    initCounters();
    initPortfolio();
    initModal();
    initCompareSlider();
    initTestimonials();
    initContactForm();
    initFab();
    initBackToTop();
    initMisc();
  });
})();
